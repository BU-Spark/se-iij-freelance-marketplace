import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InboxButton from './InboxButton';
import type { Inbox } from '../../hooks/useInbox';

const markRead = jest.fn();

const ITEMS: Inbox['items'] = [
  { key: 'a', kind: 'assignment', title: 'New assignment posted', href: '#update', unread: true },
  { key: 'b', kind: 'pitch', title: 'The editor read your pitch', href: '#update', unread: false },
];

const inboxWith = (items: Inbox['items'], loading = false): Inbox => ({
  items,
  loading,
  unreadCount: items.filter((item) => item.unread).length,
  markRead,
});

const open = async (inbox = inboxWith(ITEMS)) => {
  render(<InboxButton inbox={inbox} />);
  await userEvent.click(screen.getByRole('button', { name: /open inbox/i }));
};

describe('InboxButton', () => {
  beforeEach(() => jest.clearAllMocks());

  it('says how many updates are unread', () => {
    render(<InboxButton inbox={inboxWith(ITEMS)} />);
    expect(screen.getByRole('button', { name: 'Open inbox, 1 unread' })).toBeInTheDocument();
  });

  it('lists the updates and can narrow them to unread ones', async () => {
    await open();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: 'Unread 1' }));

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('link', { name: /new assignment posted/i })).toBeInTheDocument();
  });

  it('marks every unread update read at once', async () => {
    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Mark all read' }));

    expect(markRead).toHaveBeenCalledWith(['a']);
  });

  it('marks an opened update read and closes the panel', async () => {
    await open();
    await userEvent.click(screen.getByRole('link', { name: /new assignment posted/i }));

    expect(markRead).toHaveBeenCalledWith(['a']);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('says when there is nothing to read', async () => {
    await open(inboxWith([]));
    expect(screen.getByText('You’re all caught up.')).toBeInTheDocument();
  });

  it('says when updates are still loading', async () => {
    await open(inboxWith([], true));
    expect(screen.getByText('Loading updates…')).toBeInTheDocument();
  });
});
