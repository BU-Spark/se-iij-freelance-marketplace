import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ORGANIZATIONS } from './constants';
import OrganizationGrid from './OrganizationGrid';

describe('OrganizationGrid', () => {
  const org = ORGANIZATIONS[1];

  it('shows a card for every organization', () => {
    render(<OrganizationGrid orgs={ORGANIZATIONS} />);

    ORGANIZATIONS.forEach(({ name }) => expect(screen.getByRole('heading', { name })).toBeInTheDocument());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the organization drawer from its card', async () => {
    render(<OrganizationGrid orgs={ORGANIZATIONS} />);
    await userEvent.click(screen.getByRole('button', { name: `View ${org.name}` }));

    const drawer = screen.getByRole('dialog', { name: org.name });
    expect(within(drawer).getByText(org.bio)).toBeInTheDocument();
    expect(within(drawer).getByText(org.paymentTerms)).toBeInTheDocument();
    org.coverage.forEach((topic) => expect(within(drawer).getByText(topic)).toBeInTheDocument());
  });

  it('closes the drawer', async () => {
    render(<OrganizationGrid orgs={ORGANIZATIONS} />);
    await userEvent.click(screen.getByRole('button', { name: `View ${org.name}` }));
    await userEvent.click(screen.getByRole('button', { name: `Close ${org.name}` }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
