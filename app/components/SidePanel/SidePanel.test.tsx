import { fireEvent, render, screen } from '@testing-library/react';
import SidePanel from './SidePanel';

describe('SidePanel', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    onClose.mockClear();
    render(
      <SidePanel title="My profile" onClose={onClose} footer={<button type="button">Sign out</button>}>
        <p>Panel content</p>
      </SidePanel>
    );
  });

  it('is a dialog named by its title, with its content and footer', () => {
    expect(screen.getByRole('dialog', { name: 'My profile' })).toBeInTheDocument();
    expect(screen.getByText('Panel content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('closes with Escape, the ✕ and the dark background', () => {
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Close My profile' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
