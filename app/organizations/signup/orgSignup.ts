/** Step 1: the login for the person registering the newsroom */
export type OrgAccount = {
  contactName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export const EMPTY_ACCOUNT: OrgAccount = { contactName: '', email: '', password: '', confirmPassword: '' };
