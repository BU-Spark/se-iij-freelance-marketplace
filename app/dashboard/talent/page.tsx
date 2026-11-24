import { auth } from '@clerk/nextjs/server';
import { listSavedIds } from '../../../lib/roster';
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
  let savedIds: string[] = [];
  let loadFailed = false;

  try {
    [results, options] = await Promise.all([searchTalent(filters), listTalentFilterOptions()]);
  } catch (error) {
    console.error('Failed to search the talent directory.', error);
    loadFailed = true;
  }

  // Which of these people are already on the editor's roster; a failure only loses the "Saved" mark
  try {
    const { userId } = await auth();
    if (userId) savedIds = await listSavedIds(userId);
  } catch (error) {
    console.error('Failed to load the editor\u2019s saved freelancers.', error);
  }

  return (
    <div className={styles.shell}>
      <TalentSearch filters={filters} options={options} results={results} savedIds={savedIds} loadFailed={loadFailed} />
    </div>
  );
}
