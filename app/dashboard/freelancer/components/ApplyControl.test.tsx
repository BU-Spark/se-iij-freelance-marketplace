import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ApplyControl } from './ApplyControl';

const interested = { kind: 'interested' as const, at: '2026-01-02T00:00:00.000Z' };

it('applies when the freelancer expresses interest', async () => {
  const apply = jest.fn().mockResolvedValue({ ok: true });

  render(<ApplyControl title="City hall" apply={apply} withdraw={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: "I'm interested: City hall" }));

  await waitFor(() => expect(apply).toHaveBeenCalledTimes(1));
});

it('shows the saved application and lets the freelancer take it back', async () => {
  const withdraw = jest.fn().mockResolvedValue({ ok: true });

  render(<ApplyControl title="City hall" response={interested} apply={jest.fn()} withdraw={withdraw} />);

  expect(screen.getByText(/You've applied/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Withdraw application' }));

  await waitFor(() => expect(withdraw).toHaveBeenCalledTimes(1));
});

it('offers a retry and explains why applying failed', async () => {
  const apply = jest.fn().mockResolvedValue({ ok: false, error: 'This assignment is no longer taking answers.' });

  render(<ApplyControl title="City hall" apply={apply} withdraw={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: "I'm interested: City hall" }));

  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('no longer taking answers'));
  expect(screen.getByRole('button', { name: /Retry expressing interest/ })).toBeEnabled();
});
