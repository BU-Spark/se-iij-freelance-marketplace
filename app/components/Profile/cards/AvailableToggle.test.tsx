import { fireEvent, render, screen } from '@testing-library/react';
import AvailableToggle from './AvailableToggle';

/** The last instant of the local day, which is where switching on starts the timer */
const endOfTodayIso = () => {
  const now = new Date();
  return new Date(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - 1).toISOString();
};

describe('AvailableToggle', () => {
  it('switches on with a timer that runs to the end of today', () => {
    const onToggle = jest.fn();
    render(<AvailableToggle availableNow={false} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('switch', { name: /free right now/i }));

    expect(onToggle).toHaveBeenCalledWith(true, expect.any(String));
    expect(onToggle.mock.calls[0][1]).toBe(endOfTodayIso());
  });

  it('changes the timer when the person picks a shorter one', () => {
    const onToggle = jest.fn();
    render(<AvailableToggle availableNow availableUntil={endOfTodayIso()} onToggle={onToggle} />);

    expect(screen.getByLabelText('Free for')).toHaveValue('today');

    fireEvent.change(screen.getByLabelText('Free for'), { target: { value: '1h' } });

    const [, until] = onToggle.mock.calls.at(-1) as [boolean, string];
    expect(Math.abs(new Date(until).getTime() - (Date.now() + 60 * 60_000))).toBeLessThan(5_000);
  });

  it('shows the custom picker for a time no preset would set', () => {
    const onToggle = jest.fn();
    const until = new Date(Date.now() + 47 * 60_000).toISOString();
    render(<AvailableToggle availableNow availableUntil={until} onToggle={onToggle} />);

    expect(screen.getByLabelText('Free for')).toHaveValue('custom');
    expect(screen.getByLabelText('Stops at')).not.toHaveValue('');
  });

  it('only saves a hand-picked time once the field is left', () => {
    const onToggle = jest.fn();
    render(<AvailableToggle availableNow availableUntil={endOfTodayIso()} onToggle={onToggle} />);

    const chosen = new Date(Date.now() + 90 * 60_000);
    const pad = (value: number) => String(value).padStart(2, '0');
    const typed = `${chosen.getFullYear()}-${pad(chosen.getMonth() + 1)}-${pad(chosen.getDate())}T${pad(chosen.getHours())}:${pad(chosen.getMinutes())}`;

    fireEvent.change(screen.getByLabelText('Free for'), { target: { value: 'custom' } });
    fireEvent.change(screen.getByLabelText('Stops at'), { target: { value: typed } });

    // the field changes on every segment, so nothing is saved until the choice is finished
    expect(onToggle).not.toHaveBeenCalled();

    fireEvent.blur(screen.getByLabelText('Stops at'));

    expect(onToggle).toHaveBeenCalledWith(true, expect.any(String));
    const [, until] = onToggle.mock.calls.at(-1) as [boolean, string];
    expect(Math.abs(new Date(until).getTime() - chosen.getTime())).toBeLessThan(60_000);
  });

  it('reads a timer that has run out as switched off', () => {
    const onToggle = jest.fn();
    render(<AvailableToggle availableNow availableUntil="2020-01-01T09:00:00.000Z" onToggle={onToggle} />);

    expect(screen.getByRole('switch', { name: /free right now/i })).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByLabelText('Free for')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('switch', { name: /free right now/i }));
    expect(onToggle).toHaveBeenCalledWith(true, expect.any(String));
  });

  it('switches off without a timer', () => {
    const onToggle = jest.fn();
    render(<AvailableToggle availableNow availableUntil={endOfTodayIso()} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('switch', { name: /free right now/i }));

    expect(onToggle).toHaveBeenCalledWith(false, null);
  });
});
