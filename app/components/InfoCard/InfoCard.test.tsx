import { render, screen } from '@testing-library/react';
import InfoCard from './InfoCard';

describe('InfoCard', () => {
  it('shows the title, the action and the content', () => {
    render(
      <InfoCard title="Basic info" action={<button type="button">Edit</button>}>
        <p>Card content</p>
      </InfoCard>
    );
    expect(screen.getByText('Basic info')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('works without an action', () => {
    render(<InfoCard title="Bio">Text</InfoCard>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
