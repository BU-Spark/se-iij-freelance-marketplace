import { render, screen } from '@testing-library/react';
import DetailList from './DetailList';

describe('DetailList', () => {
  it('shows each label with its value', () => {
    render(
      <DetailList
        items={[
          { label: 'First name', value: 'Marcus' },
          { label: 'Email', value: 'marcus@example.com', wide: true },
        ]}
      />
    );
    expect(screen.getByText('First name')).toBeInTheDocument();
    expect(screen.getByText('Marcus')).toBeInTheDocument();
    expect(screen.getByText('marcus@example.com')).toBeInTheDocument();
  });

  it('shows a dash when a value is empty', () => {
    render(<DetailList items={[{ label: 'Location', value: '' }]} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
