import { fireEvent, render, screen } from '@testing-library/react';
import AvailabilityColumn from './AvailabilityColumn';
import DeskSearch from './DeskSearch';
import { DeskQueryProvider } from './deskQuery';
import { SAMPLE_ROSTER as ROSTER } from '../../../test/fixtures/roster';

it('lists the closest match first when the desk searches people', () => {
  const roster = [
    { ...ROSTER[0], id: 'in-city', name: 'Marcus Thorne', specialty: 'Reporting', city: 'Transit Hub' },
    { ...ROSTER[0], id: 'in-name', name: 'Transit Lee', specialty: 'Reporting', city: 'London' },
  ];

  render(
    <DeskQueryProvider>
      <DeskSearch />
      <AvailabilityColumn roster={roster} />
    </DeskQueryProvider>
  );

  fireEvent.change(screen.getByRole('searchbox', { name: /search assignments and roster/i }), {
    target: { value: 'transit' },
  });

  const names = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
  expect(names[0]).toBe('Transit Lee');
});

it('keeps the roster order until the desk searches', () => {
  const roster = [
    { ...ROSTER[0], id: 'second', name: 'Zed Lane', city: 'London' },
    { ...ROSTER[0], id: 'first', name: 'Amy Chen', city: 'London' },
  ];

  render(
    <DeskQueryProvider>
      <AvailabilityColumn roster={roster} />
    </DeskQueryProvider>
  );

  const names = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
  expect(names).toEqual(['Zed Lane', 'Amy Chen']);
});
