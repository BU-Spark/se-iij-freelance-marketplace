import { currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

type ProfileInput = {
  user?: {
    firstName?: unknown;
    lastName?: unknown;
    shortBio?: unknown;
    roles?: unknown;
  };
  organizationId?: unknown;
  jobTitle?: unknown;
  yearsAtDesk?: unknown;
  desks?: unknown;
  location?: unknown;
  reportingBeats?: unknown;
  workMediums?: unknown;
  tools?: unknown;
  portfolio?: unknown;
};

type OrganizationInput = { id?: unknown; name?: unknown; city?: unknown };
type ParsedEditorProfile = {
  role: 'EDITOR';
  firstName: string;
  lastName: string;
  shortBio?: string;
  jobTitle: string;
  yearsAtDesk: number;
  desks: string[];
  organization: { id: string; name: string; city: string };
};
type ParsedFreelancerProfile = {
  role: 'FREELANCER';
  firstName: string;
  lastName: string;
  shortBio?: string;
  location?: string;
  reportingBeats: string[];
  workMediums: string[];
  tools: string[];
  portfolioItems: { type: 'ARTICLE' | 'SOCIAL' | 'BROADCAST'; title: string; description?: string; url: string }[];
};
type ParsedProfile = ParsedEditorProfile | ParsedFreelancerProfile;
type ParseResult = ParsedProfile | { error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function string(value: unknown, required = false): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (required && !trimmed) return undefined;
  return trimmed || undefined;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string' && item.trim())) return undefined;
  return value.map((item: string) => item.trim());
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseInput(body: unknown): ParseResult {
  if (!isRecord(body) || !isRecord(body.profile)) return { error: 'A profile is required' } as const;

  const profile = body.profile as ProfileInput;
  if (!isRecord(profile.user)) return { error: 'Profile user details are required' } as const;

  const firstName = string(profile.user.firstName, true);
  const lastName = string(profile.user.lastName, true);
  const shortBio = string(profile.user.shortBio);
  const roles = profile.user.roles;
  const role: unknown = Array.isArray(roles) && roles.length === 1 ? roles[0] : undefined;

  if (!firstName || !lastName || (shortBio && shortBio.length > 280)) {
    return { error: 'First name, last name, and a bio of at most 280 characters are required' } as const;
  }

  if (role === 'EDITOR') {
    const jobTitle = string(profile.jobTitle, true);
    const desks = stringArray(profile.desks);
    const yearsAtDesk = profile.yearsAtDesk;
    const organizationId = string(profile.organizationId, true);
    const org = isRecord(body.organization) ? (body.organization as OrganizationInput) : undefined;

    if (!jobTitle || !desks || !desks.length || !Number.isInteger(yearsAtDesk) || (yearsAtDesk as number) < 0) {
      return { error: 'Editor profile requires a job title, valid years at desk, and a list of desks' } as const;
    }
    if (!organizationId || !org || org.id !== organizationId || !string(org.name, true) || !string(org.city, true)) {
      return { error: 'A valid organization is required for editor profiles' } as const;
    }

    return {
      role,
      firstName,
      lastName,
      shortBio,
      jobTitle,
      yearsAtDesk: yearsAtDesk as number,
      desks,
      organization: { id: organizationId, name: string(org.name, true)!, city: string(org.city, true)! },
    };
  }

  // The current shared frontend type sends USER for freelancers; accept FREELANCER for
  // clients that use the explicit profile role in the request contract.
  if (role === 'FREELANCER' || role === 'USER') {
    const reportingBeats = stringArray(profile.reportingBeats);
    const workMediums = stringArray(profile.workMediums);
    const tools = stringArray(profile.tools);
    const location = string(profile.location);
    const portfolio = profile.portfolio;

    if (!reportingBeats || !reportingBeats.length || !workMediums || !workMediums.length || !tools) {
      return { error: 'Freelancer profile requires at least one beat and medium, and a valid tools list' } as const;
    }
    if (!Array.isArray(portfolio)) {
      return { error: 'Portfolio items must have a title and a valid http(s) URL' } as const;
    }

    const portfolioItems: {
      type: 'ARTICLE' | 'SOCIAL' | 'BROADCAST';
      title: string;
      description?: string;
      url: string;
    }[] = [];
    for (const item of portfolio) {
      if (
        !isRecord(item) ||
        typeof item.type !== 'string' ||
        !['article', 'social', 'broadcast'].includes(item.type) ||
        typeof item.title !== 'string' ||
        !item.title.trim() ||
        typeof item.url !== 'string' ||
        !isHttpUrl(item.url)
      ) {
        return { error: 'Portfolio items must have a title and a valid http(s) URL' } as const;
      }
      portfolioItems.push({
        type: item.type.toUpperCase() as 'ARTICLE' | 'SOCIAL' | 'BROADCAST',
        title: item.title.trim(),
        description: string(item.description),
        url: item.url.trim(),
      });
    }

    return {
      role: 'FREELANCER',
      firstName,
      lastName,
      shortBio,
      location,
      reportingBeats,
      workMediums,
      tools,
      portfolioItems,
    };
  }

  return { error: 'Profile role must identify an editor or freelancer' } as const;
}

async function getAuthenticatedUser() {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: 'Sign in is required' }, { status: 401 }) };

  const email = user.primaryEmailAddress?.emailAddress;
  if (!email) return { error: NextResponse.json({ error: 'A primary email address is required' }, { status: 400 }) };

  return { user, email };
}

export async function GET() {
  const auth = await getAuthenticatedUser();
  if ('error' in auth) return auth.error;

  const profile = await prisma.user.findUnique({
    where: { clerkUserId: auth.user.id },
    include: {
      editorProfile: { include: { organization: true } },
      freelancerProfile: { include: { portfolio: true } },
    },
  });

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  return NextResponse.json(profile);
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if ('error' in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const parsed = parseInput(body);
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const profile = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { clerkUserId: auth.user.id } });
      if (existing) throw new Error('PROFILE_EXISTS');

      const user = await tx.user.create({
        data: {
          clerkUserId: auth.user.id,
          email: auth.email,
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          shortBio: parsed.shortBio,
          role: parsed.role,
          ...(parsed.role === 'EDITOR'
            ? {
                editorProfile: {
                  create: {
                    jobTitle: parsed.jobTitle,
                    yearsAtDesk: parsed.yearsAtDesk,
                    desks: parsed.desks,
                    organization: {
                      connectOrCreate: {
                        where: { id: parsed.organization.id },
                        create: parsed.organization,
                      },
                    },
                  },
                },
              }
            : {
                freelancerProfile: {
                  create: {
                    location: parsed.location,
                    reportingBeats: parsed.reportingBeats,
                    workMediums: parsed.workMediums,
                    tools: parsed.tools,
                    portfolio: { create: parsed.portfolioItems },
                  },
                },
              }),
        },
        include: {
          editorProfile: { include: { organization: true } },
          freelancerProfile: { include: { portfolio: true } },
        },
      });
      return user;
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'PROFILE_EXISTS') {
      return NextResponse.json({ error: 'A profile already exists for this account' }, { status: 409 });
    }
    if (isRecord(error) && error.code === 'P2002') {
      return NextResponse.json({ error: 'This email is already connected to another profile' }, { status: 409 });
    }
    console.error('Failed to create user profile', error);
    return NextResponse.json({ error: 'Unable to create profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if ('error' in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const parsed = parseInput(body);
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const existing = await prisma.user.findUnique({ where: { clerkUserId: auth.user.id } });
    if (!existing) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    if (existing.role !== parsed.role) {
      return NextResponse.json({ error: 'Changing profile role is not supported' }, { status: 409 });
    }

    const profile = await prisma.user.update({
      where: { id: existing.id },
      data: {
        email: auth.email,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        shortBio: parsed.shortBio,
        ...(parsed.role === 'EDITOR'
          ? {
              editorProfile: {
                update: {
                  jobTitle: parsed.jobTitle,
                  yearsAtDesk: parsed.yearsAtDesk,
                  desks: parsed.desks,
                  organization: {
                    connectOrCreate: {
                      where: { id: parsed.organization.id },
                      create: parsed.organization,
                    },
                  },
                },
              },
            }
          : {
              freelancerProfile: {
                update: {
                  location: parsed.location,
                  reportingBeats: parsed.reportingBeats,
                  workMediums: parsed.workMediums,
                  tools: parsed.tools,
                  portfolio: { deleteMany: {}, create: parsed.portfolioItems },
                },
              },
            }),
      },
      include: {
        editorProfile: { include: { organization: true } },
        freelancerProfile: { include: { portfolio: true } },
      },
    });
    return NextResponse.json(profile);
  } catch (error) {
    if (isRecord(error) && error.code === 'P2002') {
      return NextResponse.json({ error: 'This email is already connected to another profile' }, { status: 409 });
    }
    console.error('Failed to update user profile', error);
    return NextResponse.json({ error: 'Unable to update profile' }, { status: 500 });
  }
}
