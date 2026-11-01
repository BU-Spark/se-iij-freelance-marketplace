import { act, fireEvent, render, screen } from '@testing-library/react';
import { TOAST_DURATION, ToastProvider, useToast, type ToastType } from './ToastProvider';

// a tiny component that shows a toast when its button is clicked
function Trigger({ message, type }: { message: string; type?: ToastType }) {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast(message, type)}>
      Show
    </button>
  );
}

describe('ToastProvider', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('shows a toast', () => {
    render(
      <ToastProvider>
        <Trigger message="Profile saved" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
    expect(screen.getByRole('status')).toHaveTextContent('Profile saved');
  });

  it('closes a toast with the ✕', () => {
    render(
      <ToastProvider>
        <Trigger message="Profile saved" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByText('Profile saved')).not.toBeInTheDocument();
  });

  it('disappears by itself after a few seconds', () => {
    render(
      <ToastProvider>
        <Trigger message="Profile saved" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
    act(() => {
      jest.advanceTimersByTime(TOAST_DURATION);
    });
    expect(screen.queryByText('Profile saved')).not.toBeInTheDocument();
  });

  it('can show several toasts at once', () => {
    render(
      <ToastProvider>
        <Trigger message="Invites sent" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
    expect(screen.getAllByText('Invites sent')).toHaveLength(2);
  });

  it('does nothing (and does not crash) without the provider', () => {
    render(<Trigger message="Hello" />);
    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });
});
