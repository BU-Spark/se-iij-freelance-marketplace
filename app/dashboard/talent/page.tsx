import { EditorHeader } from '../../components/header/EditorHeader';
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
  let loadFailed = false;

  try {
    [results, options] = await Promise.all([searchTalent(filters), listTalentFilterOptions()]);
  } catch (error) {
    console.error('Failed to search the talent directory.', error);
    loadFailed = true;
  }

  return (
    <div className={styles.shell}>
      <EditorHeader />
      <TalentSearch filters={filters} options={options} results={results} loadFailed={loadFailed} />
    </div>
  );
}
