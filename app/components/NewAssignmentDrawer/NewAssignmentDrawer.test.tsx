import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NewAssignmentDrawer from './NewAssignmentDrawer';
import type { RosterMember } from '../../types/dashboard.types';

// The drawer uses Next's router to close itself; replace it with a fake we can check
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const fetchMock = jest.fn();

const jsonResponse = (status: number, body: unknown) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);

// A tiny roster: one person who can be invited, one who is off
const roster: RosterMember[] = [
  {
    id: 'marcus',
    name: 'Marcus Thorne',
    specialty: 'Reporting',
    city: 'London',
    status: 'available',
    openHours: [],
    note: '',
    weekDays: [true, true, false, true, true, false, false],
    monthDays: Array(30).fill(true),
  },
  {
    id: 'jonah',
    name: 'Jonah Weiss',
    specialty: 'Reporting',
    city: 'Berlin',
    status: 'off',
    openHours: [],
    note: '',
    weekDays: Array(7).fill(false),
    monthDays: Array(30).fill(false),
  },
];

/** Fills the fields the form requires so the request is allowed through */
const fillValidDraft = () => {
  fireEvent.click(screen.getByRole('button', { name: /editing/i }));
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'City council overnight vote' } });
};

describe('NewAssignmentDrawer', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockRefresh.mockClear();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<NewAssignmentDrawer closeHref="/dashboard" roster={roster} />);
  });

  it('opens as a dialog with a title', () => {
    expect(screen.getByRole('dialog', { name: 'New Assignment' })).toBeInTheDocument();
  });

  it('has a close link back to the dashboard', () => {
    expect(screen.getByRole('link', { name: 'Close' })).toHaveAttribute('href', '/dashboard');
  });

  it('closes when Escape is pressed', () => {
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockPush).toHaveBeenCalledWith('/dashboard', { scroll: false });
  });

  it('closes when the dark background is clicked', () => {
    fireEvent.click(screen.getByRole('button', { name: /close new assignment/i }));
    expect(mockPush).toHaveBeenCalledWith('/dashboard', { scroll: false });
  });

  it('keeps what you type and previews the slug', () => {
    const title = screen.getByLabelText('Title');
    fireEvent.change(title, { target: { value: 'City council' } });
    expect(title).toHaveValue('City council');
    expect(screen.getByLabelText('Slug')).toHaveTextContent('city-council-······');
  });

  it('starts as an open call with nobody selected', () => {
    expect(screen.getByText('0 selected')).toBeInTheDocument();
    expect(screen.getByText('Will post as open call')).toBeInTheDocument();
  });

  it('updates the count and footer when someone is ticked', () => {
    fireEvent.click(screen.getByRole('checkbox', { name: /marcus thorne/i }));
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(screen.getByText('Will invite 1 freelancer')).toBeInTheDocument();
  });

  it('does not let you invite someone who is off', () => {
    expect(screen.getByRole('checkbox', { name: /jonah weiss/i })).toBeDisabled();
  });

  it('does not call the API until the required fields are filled', () => {
    fireEvent.click(screen.getByRole('button', { name: /post assignment/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText('Give the assignment a title.')).toBeInTheDocument();
    expect(screen.getByText('Pick a project type.')).toBeInTheDocument();
  });

  it('posts the assignment, then closes and refreshes the dashboard', async () => {
    fetchMock.mockReturnValue(jsonResponse(201, { saved: true, id: 'assignment-1' }));
    fillValidDraft();

    fireEvent.click(screen.getByRole('button', { name: /post assignment/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard', { scroll: false }));
    expect(mockRefresh).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/assignments',
      expect.objectContaining({ method: 'POST', headers: { 'Content-Type': 'application/json' } })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({
      title: 'City council overnight vote',
      category: 'Editing',
      slug: expect.stringMatching(/^city-council-overnight-vote-[a-z0-9]{6}$/),
    });
  });

  it('stays open and shows the API error when the request fails', async () => {
    fetchMock.mockReturnValue(
      jsonResponse(409, {
        error: 'That slug is already used by another assignment.',
        errors: { slug: 'That slug is already used.' },
      })
    );
    fillValidDraft();

    fireEvent.click(screen.getByRole('button', { name: /post assignment/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('That slug is already used by another assignment.');
    expect(screen.getByText('That slug is already used.')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('links to onboarding when the editor has no profile yet', async () => {
    fetchMock.mockReturnValue(
      jsonResponse(400, { error: 'Finish onboarding before creating an assignment.', code: 'onboarding_required' })
    );
    fillValidDraft();

    fireEvent.click(screen.getByRole('button', { name: /post assignment/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Finish onboarding before creating an assignment.');
    expect(screen.getByRole('link', { name: /finish onboarding/i })).toHaveAttribute('href', '/onboarding');
    expect(mockPush).not.toHaveBeenCalled();
  });
});
