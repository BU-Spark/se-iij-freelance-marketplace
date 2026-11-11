import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HamburgerMenu from './HamburgerMenu';

function setup() {
  const props = {
    name: 'Marcus Thorne',
    roles: ['editor', 'freelancer'] as ('editor' | 'freelancer')[],
    activeRole: 'editor' as const,
    onRoleChange: jest.fn(),
    currentPath: '/dashboard',
    settingsHref: '/dashboard/settings',
    onSignOut: jest.fn(),
  };
  render(<HamburgerMenu {...props} />);
  return props;
}

describe('HamburgerMenu', () => {
  it('opens the menu from the ☰ button', async () => {
    setup();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /roster/i })).toBeInTheDocument();
  });

  it('closes the menu with ✕', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close Menu' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('passes sign out through', async () => {
    const props = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }));

    expect(props.onSignOut).toHaveBeenCalled();
  });
});
