import test from 'node:test';
import assert from 'node:assert/strict';

import {
  analyzeSource,
  classifyLayer,
  enrichHistoricalFindings,
  summarizeFindings,
} from '../scripts/check-project-patterns.mjs';
import {
  edgeSensitive,
  edgeStaging,
  frontendDirectTable,
  frontendApprovedView,
  pgTapSelectStar,
  publicViewSelectStar,
  safeSecurityDefiner,
  unsafeSecurityDefiner,
} from './fixtures/detector-fixtures.mjs';

const options = { mode: 'module', commit: 'test-commit', generatedAt: '2026-08-01T00:00:00.000Z' };

test('classifies representative source layers', () => {
  assert.equal(classifyLayer('apps/web/src/features/analytics/analytics-api.ts'), 'frontend');
  assert.equal(classifyLayer('supabase/functions/worker/index.ts'), 'backend/edge-function');
  assert.equal(classifyLayer('supabase/migrations/20260801000000_contract.sql'), 'sql-migration');
  assert.equal(classifyLayer('supabase/tests/001_contract.sql'), 'sql-test');
  assert.equal(classifyLayer('scripts/audit-contracts.mjs'), 'script/audit');
});

test('does not flag a SECURITY DEFINER function with an empty search_path', () => {
  const findings = analyzeSource({ file: 'supabase/migrations/secure.sql', content: safeSecurityDefiner, ...options });
  assert.equal(findings.filter((finding) => finding.id === 'security-definer-context').length, 0);
});

test('flags missing and unsafe SECURITY DEFINER search_path with contextual status', () => {
  const missing = analyzeSource({ file: 'supabase/migrations/missing-search-path.sql', content: unsafeSecurityDefiner, ...options });
  assert.equal(missing.length, 1);
  assert.equal(missing[0].id, 'security-definer-context');
  assert.equal(missing[0].status, 'candidate');
  assert.equal(missing[0].layer, 'sql-migration');
  assert.equal(missing[0].provenance.analysisType, 'structural');

  const unsafe = analyzeSource({
    file: 'supabase/migrations/unsafe-search-path.sql',
    content: unsafeSecurityDefiner.replace('security definer', 'security definer\nset search_path = public, pg_temp'),
    ...options,
  });
  assert.equal(unsafe[0].severity, 'alto');
  assert.equal(unsafe[0].status, 'probable');
});

test('does not treat SECURITY DEFINER text in SQL tests as a function finding', () => {
  const findings = analyzeSource({
    file: 'supabase/tests/001_security_definer.sql',
    content: '-- SECURITY DEFINER should be checked by this test',
    ...options,
  });
  assert.equal(findings.length, 0);
});

test('marks an older SECURITY DEFINER finding as historical-fixed when a later definition is safe', () => {
  const oldFindings = analyzeSource({ file: 'supabase/migrations/20260101000000_old.sql', content: unsafeSecurityDefiner, ...options });
  const fixedContent = safeSecurityDefiner.replace('safe_contract', 'unsafe_contract');
  const fixedFindings = analyzeSource({ file: 'supabase/migrations/20260201000000_fixed.sql', content: fixedContent, ...options });
  const enriched = enrichHistoricalFindings([...oldFindings, ...fixedFindings], [
    { file: 'supabase/migrations/20260101000000_old.sql', content: unsafeSecurityDefiner },
    { file: 'supabase/migrations/20260201000000_fixed.sql', content: fixedContent },
  ]);
  assert.equal(enriched[0].status, 'historical-fixed');
  assert.equal(enriched[0].severity, 'informativo');
});

test('ignores pgTAP select-star and reports public view select-star', () => {
  assert.equal(analyzeSource({ file: 'supabase/tests/001_select_star.sql', content: pgTapSelectStar, ...options }).length, 0);
  assert.equal(analyzeSource({ file: 'supabase/migrations/20260801000000_exists.sql', content: 'select exists(select * from public.tickets);', ...options }).length, 0);
  const findings = analyzeSource({ file: 'supabase/migrations/20260801000000_public_view.sql', content: publicViewSelectStar, ...options });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].id, 'select-star-contract');
  assert.equal(findings[0].severity, 'médio');
});

test('distinguishes frontend table access from an approved view', () => {
  const direct = analyzeSource({ file: 'apps/web/src/features/analytics/analytics-api.ts', content: frontendDirectTable, ...options });
  assert.equal(direct.length, 1);
  assert.equal(direct[0].id, 'direct-table-access');
  assert.equal(direct[0].layer, 'frontend');
  assert.equal(direct[0].status, 'candidate');
  assert.equal(analyzeSource({ file: 'apps/web/src/features/analytics/analytics-api.ts', content: frontendApprovedView, ...options }).length, 0);
});

test('does not flag a staging Edge Function table access, but flags a service-role sensitive access without authorization evidence', () => {
  assert.equal(analyzeSource({ file: 'supabase/functions/worker/index.ts', content: edgeStaging, ...options }).length, 0);
  const findings = analyzeSource({ file: 'supabase/functions/worker/index.ts', content: edgeSensitive, ...options });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, 'alto');
  assert.equal(findings[0].status, 'probable');
});

test('risk and verdict use contextual status instead of candidate volume', () => {
  const candidate = analyzeSource({ file: 'apps/web/src/features/analytics/analytics-api.ts', content: frontendDirectTable, ...options });
  const candidateSummary = summarizeFindings(candidate);
  assert.equal(candidateSummary.risk, 'baixo');
  assert.equal(candidateSummary.verdict, 'aprovado com observações');

  const confirmed = [{ ...candidate[0], severity: 'alto', status: 'confirmed', blocksMergeOrRelease: true }];
  const confirmedSummary = summarizeFindings(confirmed);
  assert.equal(confirmedSummary.risk, 'alto');
  assert.equal(confirmedSummary.verdict, 'reprovado');
  assert.equal(confirmedSummary.truncation.omitted, 0);
});

test('counts generic findings with a global occurrence pattern', () => {
  const findings = analyzeSource({
    file: 'apps/web/src/features/analytics/analytics-api.ts',
    content: 'const first: any = value; const second: any = other;',
    ...options,
  });
  const explicitAny = findings.find((finding) => finding.id === 'explicit-any');
  assert.equal(explicitAny?.occurrences, 2);
});
