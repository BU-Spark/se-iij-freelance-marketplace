import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home (IIJ welcome page)', () => {
  beforeEach(() => {
    render(<Home />);
  });

  it('renders the main heading', () => {
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /institute for independent journalists/i,
      })
    ).toBeInTheDocument();
  });

  it("renders the 'Let's get started' button linking to signup", () => {
    const cta = screen.getByRole('link', { name: /let's get started/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('href', '/signup');
  });

  it('offers existing users a link to log in', () => {
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
  });

  it('renders the IIJ logo', () => {
    expect(
      screen.getByRole('img', {
        name: /institute for independent journalists logo/i,
      })
    ).toBeInTheDocument();
  });

  it('renders the feature highlights', () => {
    expect(screen.getByText(/post & find assignments/i)).toBeInTheDocument();
    expect(screen.getByText(/pitch to real editors/i)).toBeInTheDocument();
    expect(screen.getByText(/get paid for your work/i)).toBeInTheDocument();
  });
});
