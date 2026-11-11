import { EditorHeader } from '../../components/header/EditorHeader';
import { searchTalent } from '../../../lib/talent';
import type { TalentMember } from '../../types/talent.types';
import { talentFiltersFrom } from '../../utils/talent.utils';
import TalentSearch from './TalentSearch';
import styles from '../roster/roster.module.css';

export const dynamic = 'force-dynamic';

type TalentPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function TalentPage({ searchParams }: TalentPageProps) {
  const filters = talentFiltersFrom(await searchParams);

  let results: TalentMember[] = [];
  let loadFailed = false;

  try {
    results = await searchTalent(filters);
  } catch (error) {
    console.error('Failed to search the talent directory.', error);
    loadFailed = true;
  }

  return (
    <div className={styles.shell}>
      <EditorHeader />
      <TalentSearch filters={filters} results={results} loadFailed={loadFailed} />
    </div>
  );
}
