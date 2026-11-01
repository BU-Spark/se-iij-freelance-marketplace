import { render, screen } from '@testing-library/react';
import ProfileButton from './ProfileButton';

let mockParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useSearchParams: () => mockParams,
  useRouter: () => ({ push: jest.fn() }),
}));

describe('ProfileButton', () => {
  beforeEach(() => {
    mockParams = new URLSearchParams();
  });

  it('links to My profile on the current page', () => {
    render(<ProfileButton />);
    expect(screen.getByRole('link', { name: 'Open my profile' })).toHaveAttribute('href', '/dashboard?panel=profile');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the panel when the URL asks for it', () => {
    mockParams = new URLSearchParams('panel=profile');
    render(<ProfileButton />);
    expect(screen.getByRole('dialog', { name: 'My profile' })).toBeInTheDocument();
  });
});
