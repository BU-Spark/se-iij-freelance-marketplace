import { fireEvent, render, screen } from '@testing-library/react';
import InvitePicker from './InvitePicker';
import type { RosterMember } from '../../types/dashboard.types';

const person = (id: string, name: string, overrides: Partial<RosterMember> = {}): RosterMember => ({
  id,
  name,
  specialty: 'Politics',
  beats: ['Politics', 'Housing'],
  city: 'Leeds, UK',
  status: 'available',
  openHours: [],
  note: '',
  weekDays: [],
  monthDays: [],
  ...overrides,
});

const people = [person('a', 'Sarah Jenkins'), person('b', 'Jonah Park', { city: 'Berlin', status: 'off' })];

describe('InvitePicker', () => {
  it('lists everyone with a tick box, including people who are off today', () => {
    const onToggle = jest.fn();
    render(<InvitePicker people={people} picked={['a']} onToggle={onToggle} />);

    expect(screen.getByRole('checkbox', { name: /sarah jenkins/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /jonah park/i })).not.toBeChecked();

    fireEvent.click(screen.getByRole('checkbox', { name: /jonah park/i }));
    expect(onToggle).toHaveBeenCalledWith('b');
  });

  it('searches by name, beat or city, and says when nothing matches', () => {
    render(<InvitePicker people={people} picked={[]} onToggle={jest.fn()} />);
    const search = screen.getByLabelText('Search freelancers');

    fireEvent.change(search, { target: { value: 'berlin' } });
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);

    fireEvent.change(search, { target: { value: 'housing' } });
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);

    fireEvent.change(search, { target: { value: 'zzz' } });
    expect(screen.getByText('No freelancer matches “zzz”.')).toBeInTheDocument();
  });
});
