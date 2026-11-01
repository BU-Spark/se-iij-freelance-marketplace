import { fireEvent, render, screen, within } from '@testing-library/react';
import InviteList from './InviteList';
import type { RosterMember } from '../../types/dashboard.types';

const person = (id: string, name: string, specialty: string, city: string, status: RosterMember['status']) => ({
  id,
  name,
  specialty,
  city,
  status,
  openHours: [],
  note: '',
  weekDays: Array(7).fill(false),
  monthDays: Array(30).fill(false),
});

const members: RosterMember[] = [
  person('marcus', 'Marcus Thorne', 'Reporting', 'London', 'available'),
  person('elena', 'Elena Rodriguez', 'Editing', 'New York', 'busy'),
  person('jonah', 'Jonah Weiss', 'Reporting', 'Berlin', 'off'),
];

function setup(selected: string[] = []) {
  const onToggle = jest.fn();
  render(<InviteList members={members} selected={selected} onToggle={onToggle} />);
  return onToggle;
}

const openSearch = () => fireEvent.focus(screen.getByRole('combobox'));

describe('InviteList', () => {
  it('shows how many people are selected', () => {
    setup(['marcus']);
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  it('opens the roster when the search box is focused', () => {
    setup();
    openSearch();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('filters by name, beat or city', () => {
    setup();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'berlin' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: /jonah weiss/i })).toBeInTheDocument();
  });

  it('invites someone when clicked', () => {
    const onToggle = setup();
    openSearch();
    fireEvent.mouseDown(screen.getByRole('option', { name: /marcus thorne/i }));
    expect(onToggle).toHaveBeenCalledWith('marcus');
  });

  it('does not invite someone who is off', () => {
    const onToggle = setup();
    openSearch();
    const jonah = screen.getByRole('option', { name: /jonah weiss/i });
    expect(jonah).toHaveAttribute('aria-disabled', 'true');
    fireEvent.mouseDown(jonah);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('shows invited people as chips and hides them from the list', () => {
    setup(['marcus']);
    const chips = screen.getByRole('list', { name: 'Invited freelancers' });
    expect(within(chips).getByText('Marcus Thorne')).toBeInTheDocument();
    openSearch();
    expect(screen.queryByRole('option', { name: /marcus thorne/i })).not.toBeInTheDocument();
  });

  it('removes someone with the chip ✕', () => {
    const onToggle = setup(['marcus']);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Marcus Thorne' }));
    expect(onToggle).toHaveBeenCalledWith('marcus');
  });

  it('can be used with the keyboard', () => {
    const onToggle = setup();
    const search = screen.getByRole('combobox');
    openSearch();
    fireEvent.keyDown(search, { key: 'ArrowDown' }); // Marcus → Elena
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(onToggle).toHaveBeenCalledWith('elena');
  });

  it('says when nobody matches', () => {
    setup();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzz' } });
    expect(screen.getByText('No one on your roster matches “zzz”.')).toBeInTheDocument();
  });
});
