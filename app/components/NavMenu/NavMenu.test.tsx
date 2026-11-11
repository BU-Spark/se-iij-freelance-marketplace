import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavMenu from './NavMenu';

function setup(overrides: Partial<React.ComponentProps<typeof NavMenu>> = {}) {
  const props = {
    name: 'Marcus Thorne',
    roles: ['editor', 'freelancer'] as const,
    activeRole: 'editor' as const,
    onRoleChange: jest.fn(),
    currentPath: '/dashboard',
    profileHref: '/dashboard?panel=profile',
    onClose: jest.fn(),
    onSignOut: jest.fn(),
    ...overrides,
  };
  render(<NavMenu {...props} roles={[...props.roles]} />);
  return props;
}

describe('NavMenu', () => {
  it('shows the editor links when working as editor', () => {
    setup();
    expect(screen.getByRole('link', { name: /desk/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /roster/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /pitches/i })).toBeInTheDocument();
  });

  it('shows the freelancer links when working as freelancer', () => {
    setup({ activeRole: 'freelancer' });
    expect(screen.getByRole('link', { name: /available assignments/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /my pitches/i })).toHaveAttribute('href', '/dashboard/freelancer/pitches');
    expect(screen.queryByRole('link', { name: /make a pitch/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /roster/i })).not.toBeInTheDocument();
  });

  it('hides the switch when the person has only one role', () => {
    setup({ roles: ['editor'] });
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('calls onRoleChange when switching role', async () => {
    const props = setup();
    await userEvent.click(screen.getByRole('radio', { name: /freelancer/i }));
    expect(props.onRoleChange).toHaveBeenCalledWith('freelancer');
  });

  it('marks the current page', () => {
    setup({ currentPath: '/dashboard/roster' });
    expect(screen.getByRole('link', { name: /roster/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /desk/i })).not.toHaveAttribute('aria-current');
  });

  it('shows a badge count', () => {
    setup({ badges: { pitches: 2 } });
    expect(screen.getByRole('link', { name: /pitches/i })).toHaveTextContent('2');
  });

  it('links to my profile', () => {
    setup();
    expect(screen.getByRole('link', { name: /my profile/i })).toHaveAttribute('href', '/dashboard?panel=profile');
  });

  it('signs out', async () => {
    const props = setup();
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(props.onSignOut).toHaveBeenCalled();
  });
});
