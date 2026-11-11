import { workspaceHome } from './workspace.utils';

describe('workspaceHome', () => {
  it('sends people with an editor desk to the dashboard', () => {
    expect(workspaceHome(['editor'])).toBe('/dashboard');
    expect(workspaceHome(['freelancer', 'editor'])).toBe('/dashboard');
  });

  it('sends freelancer-only people to the freelancer workspace', () => {
    expect(workspaceHome(['freelancer'])).toBe('/dashboard/freelancer');
  });
});
