import { workspaceForPath, workspaceHome } from './workspace.utils';

describe('workspaceHome', () => {
  it('sends people with an editor desk to the dashboard', () => {
    expect(workspaceHome(['editor'])).toBe('/dashboard');
    expect(workspaceHome(['freelancer', 'editor'])).toBe('/dashboard');
  });

  it('sends freelancer-only people to the freelancer workspace', () => {
    expect(workspaceHome(['freelancer'])).toBe('/dashboard/freelancer');
  });
});

describe('workspaceForPath', () => {
  it('puts the desk pages on the editor side', () => {
    for (const path of ['/dashboard', '/dashboard/roster', '/dashboard/talent', '/dashboard/pitches']) {
      expect(workspaceForPath(path, ['editor', 'freelancer'])).toBe('editor');
    }
  });

  it('puts the freelancer pages on the freelancer side', () => {
    for (const path of ['/dashboard/freelancer', '/dashboard/freelancer/make-a-pitch', '/dashboard/assignments']) {
      expect(workspaceForPath(path, ['editor', 'freelancer'])).toBe('freelancer');
    }
  });

  it('shows one assignment from the desk unless the person only freelances', () => {
    expect(workspaceForPath('/dashboard/assignments/a-1', ['editor', 'freelancer'])).toBe('editor');
    expect(workspaceForPath('/dashboard/assignments/a-1', ['freelancer'])).toBe('freelancer');
    expect(workspaceForPath('/dashboard/assignments/a-1', [])).toBe('editor');
  });

  it('shows settings from the desk unless the person only freelances', () => {
    expect(workspaceForPath('/dashboard/settings', ['editor', 'freelancer'])).toBe('editor');
    expect(workspaceForPath('/dashboard/settings', ['freelancer'])).toBe('freelancer');
    expect(workspaceForPath('/dashboard/settings', [])).toBe('editor');
  });
});
