import { fireEvent, render, screen } from '@testing-library/react';
import ProfilePanel from './ProfilePanel';
import { MOCK_PROFILE } from './constants';

const onlyFreelancer = { ...MOCK_PROFILE, roles: [MOCK_PROFILE.roles[0]] };

describe('ProfilePanel', () => {
  it('shows the basic info', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} />);
    expect(screen.getByRole('dialog', { name: 'My profile' })).toBeInTheDocument();
    expect(screen.getByText('Marcus Thorne')).toBeInTheDocument();
    expect(screen.getByText(MOCK_PROFILE.basic.email)).toBeInTheDocument();
    expect(screen.getByText(MOCK_PROFILE.basic.location)).toBeInTheDocument();
  });

  it('shows one card per role with its own details', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} />);
    expect(screen.getByText('Freelancer')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Usual rate')).toBeInTheDocument();
    expect(screen.getByText('Organisation')).toBeInTheDocument();
  });

  it('offers to add only the roles the person does not have', () => {
    const onAddRole = jest.fn();
    render(<ProfilePanel profile={onlyFreelancer} onClose={jest.fn()} onAddRole={onAddRole} />);
    expect(screen.queryByRole('button', { name: /add the freelancer role/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /add the editor role/i }));
    expect(onAddRole).toHaveBeenCalledWith('editor');
  });

  it('has no add button when the person has every role', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onAddRole={jest.fn()} />);
    expect(screen.queryByRole('button', { name: /add the/i })).not.toBeInTheDocument();
  });

  it('closes with the ✕', () => {
    const onClose = jest.fn();
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close My profile' }));
    expect(onClose).toHaveBeenCalled();
  });
});
