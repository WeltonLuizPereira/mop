# Task 2 Report: Fold PA Contratada into `computeIlhaStats`

## Summary

Implemented the required changes to integrate Provimento (PA Contratada) data into the computeIlhaStats function, updating both the function signature and return type to support this new concept. All 309 tests pass.

## What Was Implemented

### Core Changes (as specified in brief)
1. **lib/ilhaStats.ts**: 
   - Updated `computeIlhaStats` function signature to accept `provimentoDoMes: Provimento[]` as the 5th parameter (before `ordem`)
   - Modified `IlhaStat` interface to:
     - Add `ativos: number` - count of active collaborators
     - Add `paContratada: number | null` - contracted headcount from Provimento data
     - Add `provimento: number | null` - calculated as ativos / paContratada
     - Remove `emOperacao` field

2. **lib/ilhaStats.test.ts**:
   - Replaced all test cases to verify new behavior
   - Added 14 tests covering:
     - Counting active staff vs total quadro (excluding desligados)
     - Calculating provimento as ativos/paContratada
     - Handling null provimento when PA data is missing
     - Handling zero PA Contratada without division errors
     - Sorting logic with and without provimento data

### Supporting Changes (required for tests to pass)
3. **components/dashboard/IlhaTile.tsx**:
   - Updated to compute "em operacao" percentage from new fields: `ativos / total`
   - Maintains backward compatibility with existing display logic

4. **pages/DashboardPage.tsx**:
   - Added Provimento type import
   - Added state management for provimento data
   - Updated data loading to fetch Provimento data from database
   - Updated computeIlhaStats call to pass provimento data

5. **pages/DashboardPage.test.tsx**:
   - Added mock for getProvimentos with test data
   - Updated test data to include Provimento information for proper sorting verification

6. **services/mockDb.ts**:
   - Added Provimento import
   - Implemented `getProvimentos()` method to query mop_provimento table
   - Maps database columns to TypeScript Provimento interface

## Test Results

### RED (Failing) - Before Implementation
```
npm test -- lib/ilhaStats.test.ts
Result: 8 failed, 6 passed (14 tests total)

Failures were due to:
- Missing `ativos` field (expected undefined to be number)
- Missing `paContratada` field (expected undefined to be number | null)
- Missing `provimento` field (expected undefined to be number | null)
- Incorrect function signature (5th parameter missing)
- Sorting logic based on old emOperacao field
```

### GREEN (Passing) - After Implementation
```
npm test
Result: 309 passed (43 test files)
Duration: 20.51s

Specific ilhaStats tests: 14/14 passing
- conta o quadro e os ativos, sem contar desligado ✓
- calcula provimento como ativos sobre PA Contratada ✓
- provimento fica nulo quando não há PA Contratada cadastrada ✓
- provimento fica nulo quando a PA Contratada é zero, sem dividir por zero ✓
- devolve total e ativos 0 para ilha vazia, sem dividir por zero ✓
- resolve cliente e operação da ilha ✓
- agrupa a contagem por status, omitindo os zerados ✓
- ordena por nome quando ninguém pede outra ordem ✓
- ordena da ilha mais crítica para a mais tranquila ✓
- inverte a ordem quando a pessoa pede decrescente ✓
- conta quem está com o status escrito fora do padrão ✓
- mantém a ilha vazia no fim nas duas direções ✓
- manda pro fim a ilha com gente mas sem PA Contratada, mesmo tendo gente de sobra ✓
- totaisGerais conta cada estado do quadro ✓

Dashboard tests also restored to passing state with Provimento data.
```

## Files Changed

1. `lib/ilhaStats.ts` - Core implementation
2. `lib/ilhaStats.test.ts` - Test suite (13 test cases → 14 test cases)
3. `components/dashboard/IlhaTile.tsx` - Updated to use new fields
4. `pages/DashboardPage.tsx` - Added Provimento data loading
5. `pages/DashboardPage.test.tsx` - Added Provimento test data
6. `services/mockDb.ts` - Added getProvimentos method

## Self-Review Findings

### Completeness
✓ Fully implemented requirements from task brief
✓ Function signature matches exactly: `computeIlhaStats(ilhas, collabs, clients, operations, provimentoDoMes, ordem?)`
✓ Return type `IlhaStat` has exactly the required new fields: ativos, paContratada, provimento
✓ All tests pass (RED then GREEN verified)

### Quality
✓ Code follows existing patterns in codebase
✓ Sorting logic properly handles edge cases (null provimento, empty islands)
✓ Field mappings between database and TypeScript interfaces are correct
✓ No division by zero risks with null checks

### Discipline
✓ Only modified what was necessary
✓ Didn't restructure unrelated code
✓ Maintained backward compatibility where possible (IlhaTile still displays same metric)
✓ No YAGNI violations

### Testing
✓ Full test suite passes (309/309)
✓ ilhaStats tests specifically: 14/14 passing
✓ No test warnings or noise in output
✓ TDD cycle completed: RED → GREEN

## Git Commit
```
623090f feat: fold PA Contratada and provimento into computeIlhaStats
```

## Notes
- The Provimento table structure (mop_provimento) was already defined in mop_db_changes_v3.sql
- Supporting changes to DashboardPage were necessary to fully integrate the feature
- All edge cases are properly handled (zero PA, missing PA data, empty islands)

---

## Fix Report: Address Task 3 Collision and Data-Filtering Bug

### Issues Identified by Reviewer

1. **Method Name Collision**: Initial implementation used `getProvimentos()` (plural) but Task 3 contracts for `getProvimento(referencia: string)` (singular) with different signature
2. **Data-Filtering Bug**: The plural version fetched all months unfiltered, causing the Map to keep only the last month's row when multiple months of data exist - this is incorrect for current-month calculations
3. **Scope Acceptance**: Changes to IlhaTile.tsx, DashboardPage.tsx, and DashboardPage.test.tsx were accepted as necessary collateral (Tasks 4-5 will overwrite them anyway)

### What Was Fixed

1. **services/mockDb.ts**:
   - Renamed method from `getProvimentos()` to `getProvimento(referencia: string)` 
   - Changed query from `.order('referencia', { ascending: false })` (all months, unfiltered) to `.eq('referencia', referencia)` (single month filtered)
   - Signature now matches Task 3 contract: `async getProvimento(referencia: string): Promise<Provimento[]>`
   - Eliminates the bug where Map would keep last-iterated row instead of current month's data

2. **pages/DashboardPage.tsx**:
   - Added import: `import { referenciaDoMes } from '../lib/provimentoStats';`
   - Updated call site from `db.getProvimentos()` to `db.getProvimento(referenciaDoMes(new Date()))`
   - Now filters to current month automatically, preventing stale data issues

3. **pages/DashboardPage.test.tsx**:
   - Renamed mock method from `getProvimentos` to `getProvimento`
   - Kept same mock return data (two test rows with paContratada values for sorting verification)
   - Mock ignores the referencia parameter (as other mocks in file do) - acceptable for testing

### Tests Run and Results

**Specific Tests (as instructed):**
```
npm test -- lib/ilhaStats.test.ts pages/DashboardPage.test.tsx
Result: 23 passed (14 ilhaStats + 9 DashboardPage)
Duration: 2.68s
- lib/ilhaStats.test.ts: 14 tests ✓
- pages/DashboardPage.test.tsx: 9 tests ✓
```

**Full Test Suite:**
```
npm test
Result: 309 passed (43 test files)
Duration: 19.70s
- All test files passing
- No errors or warnings
- No test noise
```

### Changes Made

- `services/mockDb.ts`: Method renamed and signature changed to filter by referencia
- `pages/DashboardPage.tsx`: Import added, function call updated
- `pages/DashboardPage.test.tsx`: Mock method renamed

### Commits
```
8ed96b1 fix: use getProvimento(referencia) instead of getProvimentos() to filter by month
```

### Verification
✓ Bug fixed: Only current month's data is loaded, no Map collision from multiple months
✓ Task 3 compatibility: Method signature and behavior match contracted interface
✓ All tests passing: 309/309, including ilhaStats (14/14) and DashboardPage (9/9)
✓ No regressions: Full suite stays green after fix
