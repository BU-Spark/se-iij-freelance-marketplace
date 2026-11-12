import { fireEvent, render, screen } from '@testing-library/react';
import PitchListItem from './PitchListItem';
import type { Pitch } from '../../types/dashboard.types';

const pitch: Pitch = {
  id: 'shadow-budget',
  slug: 'shadow-budget-city-hall',
  category: 'Reporting/Writing',
  tags: ['City Hall'],
  freelancer: { id: 'marcus', name: 'Marcus Thorne' },
  submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
  status: 'new',
  summary: '',
  location: '',
  length: '',
  deadline: '',
  rate: '',
  description: '',
};

describe('PitchListItem', () => {
  it('shows a readable heading (not the slug), category, status, freelancer and time', () => {
    render(<PitchListItem pitch={pitch} selected={false} onSelect={jest.fn()} />);
    expect(screen.getByText('Shadow budget city hall')).toBeInTheDocument();
    expect(screen.queryByText('shadow-budget-city-hall')).not.toBeInTheDocument();
    expect(screen.getByText('Reporting/Writing')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Marcus Thorne · 3h ago')).toBeInTheDocument();
  });

  it('tells screen readers whether it is the open pitch', () => {
    render(<PitchListItem pitch={pitch} selected onSelect={jest.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<PitchListItem pitch={pitch} selected={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalled();
  });
});
