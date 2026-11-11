/**
 * @jest-environment node
 */
import { buildTalentQuery } from './talent';
import { TALENT_PAGE_SIZE } from '../app/utils/talent.utils';

describe('buildTalentQuery', () => {
  it('with no filters, lists every freelancer, people free right now first, capped', () => {
    const { sql, params } = buildTalentQuery({});

    expect(sql).toContain("'freelancer' = ANY(u.roles)");
    expect(sql).not.toContain('ILIKE');
    expect(sql).toMatch(/ORDER BY u\.available_now DESC/);
    expect(params).toEqual([TALENT_PAGE_SIZE]);
  });

  it('binds search text as a parameter and escapes LIKE wildcards', () => {
    const { sql, params } = buildTalentQuery({ q: "  50%_o'brien  " });

    expect(sql).toContain('ILIKE $1');
    expect(sql).not.toContain("o'brien");
    expect(params[0]).toBe("%50\\%\\_o'brien%");
  });

  it('adds one bound condition per filter, numbered in order', () => {
    const { sql, params } = buildTalentQuery({
      q: 'housing',
      beat: 'Politics',
      medium: 'Audio',
      location: 'Leeds, UK',
      availableNow: true,
    });

    expect(sql).toContain('$2 = ANY(f.reporting_beats) OR $2 = ANY(f.beat_tags)');
    expect(sql).toContain('$3 = ANY(f.work_mediums)');
    expect(sql).toContain('f.location = $4');
    expect(sql).toContain('u.available_now = true');
    expect(sql).toContain('LIMIT $5');
    expect(params).toEqual(['%housing%', 'Politics', 'Audio', 'Leeds, UK', TALENT_PAGE_SIZE]);
  });

  it('ignores blank search text', () => {
    expect(buildTalentQuery({ q: '   ' }).params).toEqual([TALENT_PAGE_SIZE]);
  });
});
