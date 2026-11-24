'use client';

import { useId, useState } from 'react';
import { RosterCard, ReportButton } from '../../components';
import type { TalentMember } from '../../types/talent.types';
import styles from './talent.module.css';

type TalentCardProps = {
  member: TalentMember;
  saved: boolean;
  onSave: (member: TalentMember) => void;
};

const CLIP_LABEL: Record<string, string> = { article: 'Article', social: 'Social', broadcast: 'Broadcast' };

export default function TalentCard({ member, saved, onSave }: TalentCardProps) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const { profile } = member;

  const facts = [
    { label: 'Based in', value: member.city },
    { label: 'Community covered', value: profile.communityCovered },
    { label: 'Rate', value: profile.rate },
  ].filter((fact) => fact.value);

  const hasMore =
    Boolean(profile.shortBio || profile.longBio) ||
    facts.length > 0 ||
    (member.beats?.length ?? 0) > 0 ||
    member.mediums.length > 0 ||
    profile.tools.length > 0 ||
    profile.portfolio.length > 0;

  return (
    <RosterCard
      member={member}
      footer={
        <div className={styles.footer}>
          <div className={styles.footerRow}>
            <button
              type="button"
              className={styles.toggle}
              aria-expanded={open}
              aria-controls={detailsId}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? 'Hide profile' : 'View profile'}
              <svg
                className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </svg>
            </button>
            {saved ? (
              <span className={styles.invited}>Saved</span>
            ) : (
              <button
                type="button"
                className={styles.inviteSmall}
                aria-label={`Save ${member.name} to your roster`}
                onClick={() => onSave(member)}
              >
                Save
              </button>
            )}
            <ReportButton targetType="account" targetId={member.id} targetLabel={member.name} compact />
          </div>

          {open && (
            <div id={detailsId} className={styles.details} role="region" aria-label={`${member.name}'s profile`}>
              {!hasMore && <p className={styles.muted}>{member.name} hasn&apos;t added more to their profile yet.</p>}

              {(profile.shortBio || profile.longBio) && (
                <section className={styles.block}>
                  <h4 className={styles.blockTitle}>About</h4>
                  {profile.shortBio && <p className={styles.lead}>{profile.shortBio}</p>}
                  {profile.longBio && <p className={styles.bio}>{profile.longBio}</p>}
                </section>
              )}

              {facts.length > 0 && (
                <dl className={styles.facts}>
                  {facts.map((fact) => (
                    <div key={fact.label}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <Chips title="Beats" values={member.beats ?? []} />
              <Chips title="Mediums" values={member.mediums} />
              <Chips title="Tools" values={profile.tools} />

              {profile.portfolio.length > 0 && (
                <section className={styles.block}>
                  <h4 className={styles.blockTitle}>Work samples</h4>
                  <ul className={styles.clips}>
                    {profile.portfolio.map((clip) => (
                      <li key={clip.url}>
                        <a href={clip.url} target="_blank" rel="noopener noreferrer" className={styles.clip}>
                          <span className={styles.clipTitle}>
                            {clip.title}
                            <span aria-hidden="true"> ↗</span>
                          </span>
                          {clip.type && <span className={styles.clipType}>{CLIP_LABEL[clip.type] ?? clip.type}</span>}
                        </a>
                        {clip.description && <p className={styles.clipDescription}>{clip.description}</p>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>
      }
    />
  );
}

function Chips({ title, values }: { title: string; values: string[] }) {
  if (values.length === 0) return null;

  return (
    <section className={styles.block}>
      <h4 className={styles.blockTitle}>{title}</h4>
      <ul className={styles.chipList}>
        {values.map((value) => (
          <li key={value} className={styles.medium}>
            {value}
          </li>
        ))}
      </ul>
    </section>
  );
}
