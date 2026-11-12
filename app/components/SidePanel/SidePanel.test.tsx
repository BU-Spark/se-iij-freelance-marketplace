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

  it('has no expand link when there is no full page to open', () => {
    expect(screen.queryByRole('link', { name: /expand/i })).not.toBeInTheDocument();
  });

  it('offers the full page as a little expand link', () => {
    render(
      <SidePanel title="My profile" onClose={jest.fn()} expandHref="/dashboard/settings" expandLabel="Open settings">
        <p>Not the panel under test</p>
      </SidePanel>
    );

    expect(screen.getByRole('link', { name: 'Open settings' })).toHaveAttribute('href', '/dashboard/settings');
  });
});

describe('stacked SidePanels', () => {
  it('Escape closes only the top panel and keeps the page locked under the other', () => {
    const closeProfile = jest.fn();
    const closeRole = jest.fn();
    const { rerender } = render(
      <>
        <SidePanel title="My profile" onClose={closeProfile}>
          <p>Profile</p>
        </SidePanel>
        <SidePanel title="Editor details" onClose={closeRole}>
          <p>Role</p>
        </SidePanel>
      </>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(closeRole).toHaveBeenCalledTimes(1);
    expect(closeProfile).not.toHaveBeenCalled();

    // the top one goes away; the page behind My profile must not start scrolling
    rerender(
      <SidePanel title="My profile" onClose={closeProfile}>
        <p>Profile</p>
      </SidePanel>
    );
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('lets the page scroll again when the whole stack goes away together', () => {
    const { unmount } = render(
      <>
        <SidePanel title="My profile" onClose={jest.fn()}>
          <p>Profile</p>
        </SidePanel>
        <SidePanel title="Editor details" onClose={jest.fn()}>
          <p>Role</p>
        </SidePanel>
      </>
    );
    expect(document.body.style.overflow).toBe('hidden');

    // e.g. "Edit availability in settings" navigates and unmounts both panels at once
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
