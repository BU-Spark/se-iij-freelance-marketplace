import { redirect } from 'next/navigation';
import AssignmentsPage from './page';

jest.mock('next/navigation', () => ({ redirect: jest.fn() }));

it('redirects legacy assignment links to the consolidated freelancer dashboard', () => {
  AssignmentsPage();
  expect(redirect).toHaveBeenCalledWith('/dashboard/freelancer');
});
