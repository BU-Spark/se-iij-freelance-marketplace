import { fireEvent, render, screen } from '@testing-library/react';
import Modal from './Modal';

describe('Modal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    onClose.mockClear();
    render(
      <Modal title="Review candidates" subtitle="Pick one to assign." onClose={onClose}>
        <p>Body text</p>
      </Modal>
    );
  });

  it('is a dialog named by its title', () => {
    expect(screen.getByRole('dialog', { name: 'Review candidates' })).toBeInTheDocument();
    expect(screen.getByText('Pick one to assign.')).toBeInTheDocument();
    expect(screen.getByText('Body text')).toBeInTheDocument();
  });

  it('closes with Escape, the ✕ and the dark background', () => {
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Close popup' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
