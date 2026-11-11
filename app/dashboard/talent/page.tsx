import { auth } from '@clerk/nextjs/server';
import { listInvitedIds } from '../../../lib/roster';
import { listTalentFilterOptions, searchTalent } from '../../../lib/talent';
import type { TalentFilterOptions, TalentMember } from '../../types/talent.types';
import { talentFiltersFrom } from '../../utils/talent.utils';
import TalentSearch from './TalentSearch';
import styles from '../roster/roster.module.css';

export const dynamic = 'force-dynamic';

type TalentPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function TalentPage({ searchParams }: TalentPageProps) {
  const filters = talentFiltersFrom(await searchParams);

  let results: TalentMember[] = [];
  let options: TalentFilterOptions = { beats: [], mediums: [], locations: [] };
  let invitedIds: string[] = [];
  let loadFailed = false;

  try {
    [results, options] = await Promise.all([searchTalent(filters), listTalentFilterOptions()]);
  } catch (error) {
    console.error('Failed to search the talent directory.', error);
    loadFailed = true;
  }

  // Which of these people are already on the editor's roster; a failure only loses the "Invited" mark
  try {
    const { userId } = await auth();
    if (userId) invitedIds = await listInvitedIds(userId);
  } catch (error) {
    console.error('Failed to load the editor\u2019s roster invites.', error);
  }

  return (
    <div className={styles.shell}>
      <TalentSearch
        filters={filters}
        options={options}
        results={results}
        invitedIds={invitedIds}
        loadFailed={loadFailed}
      />
    </div>
  );
}
