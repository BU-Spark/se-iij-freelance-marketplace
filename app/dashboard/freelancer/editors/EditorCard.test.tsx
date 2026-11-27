import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NAV_ITEMS } from '../../../components/NavMenu/config/navConfig';
import { ORGANIZATIONS } from '../organizations/constants';
import { EDITORS } from './constants';
import EditorCard from './EditorCard';

describe('EditorCard', () => {
  const editor = EDITORS[0];

  it('shows the name, role and desks', () => {
    render(<EditorCard editor={editor} />);

    expect(screen.getByRole('heading', { name: editor.name })).toBeInTheDocument();
    expect(screen.getByText(editor.role)).toBeInTheDocument();
    editor.desks.forEach((desk) => expect(screen.getByText(desk)).toBeInTheDocument());
  });

  it('names the newsroom they work for and links their email', () => {
    render(<EditorCard editor={editor} />);
    const org = ORGANIZATIONS.find((item) => item.id === editor.organizationId)!;

    expect(screen.getByText(org.name, { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: editor.email })).toHaveAttribute('href', `mailto:${editor.email}`);
  });

  it('offers a flag that opens the report form for that editor', async () => {
    render(<EditorCard editor={editor} />);

    await userEvent.click(screen.getByRole('button', { name: `Report ${editor.name}` }));

    expect(screen.getByRole('dialog', { name: 'Report this account' })).toBeInTheDocument();
  });

  it('only lists editors from newsrooms on the Organizations page', () => {
    const orgIds = ORGANIZATIONS.map((org) => org.id);
    EDITORS.forEach((item) => expect(orgIds).toContain(item.organizationId));
  });

  it('is reachable from the freelancer menu, after Organizations', () => {
    const keys = NAV_ITEMS.freelancer.map((item) => item.key);

    expect(NAV_ITEMS.freelancer).toContainEqual(
      expect.objectContaining({ label: 'Editors', href: '/dashboard/freelancer/editors' })
    );
    expect(keys.indexOf('editors')).toBe(keys.indexOf('organizations') + 1);
  });
});
