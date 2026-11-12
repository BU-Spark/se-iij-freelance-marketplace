/** An editor a freelancer can pitch, and the newsroom desk they run */
export type EditorProfile = {
  id: string;
  name: string;
  /** their job title, e.g. "Metro editor" */
  role: string;
  /** matches an id in the Organizations page's ORGANIZATIONS */
  organizationId: string;
  desks: string[];
  email: string;
};

/*
 * Temporary sample editors, one or two per sample newsroom.
 * TODO: load from the backend once an editors API exists.
 */
export const EDITORS: EditorProfile[] = [
  {
    id: 'dana-okafor',
    name: 'Dana Okafor',
    role: 'Metro editor',
    organizationId: 'meridian',
    desks: ['Politics', 'Government Accountability'],
    email: 'dana.okafor@meridianpost.example',
  },
  {
    id: 'luis-ferreira',
    name: 'Luis Ferreira',
    role: 'Investigations editor',
    organizationId: 'meridian',
    desks: ['Law/Legal Issues'],
    email: 'luis.ferreira@meridianpost.example',
  },
  {
    id: 'hanna-vogel',
    name: 'Hanna Vogel',
    role: 'Features editor',
    organizationId: 'crosswind',
    desks: ['Culture', 'Climate'],
    email: 'hanna.vogel@crosswind.example',
  },
  {
    id: 'ruth-adeyemi',
    name: 'Ruth Adeyemi',
    role: 'Managing editor',
    organizationId: 'signal',
    desks: ['Tech', 'Health'],
    email: 'ruth@signalroom.example',
  },
  {
    id: 'kenji-mori',
    name: 'Kenji Mori',
    role: 'World desk editor',
    organizationId: 'broadsheet',
    desks: ['World', 'National Security'],
    email: 'kenji.mori@broadsheetpacific.example',
  },
];
