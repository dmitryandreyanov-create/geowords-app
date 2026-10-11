# GeoWords PR #8 — F1–F4 handoff (11 October 2026)

The author-approved learning rule remains **1 original + 6 generated = 7 solved words per step**, followed by automatic progression. The existing 11 Mountains puzzles and `main` are unchanged.

## Current GitHub state

Completed on PR branch:
- `engine/semantic.js`: physical letter location (`sitsIn`) can affect cue uniqueness via `matchesRegion()`.
- `data/dictionary.js`: 18 non-spoiler draft practice words.
- `data/courses.js`: each of the first three Rivers steps uses six different practice words.
- `scripts/validate-f4.mjs`: standalone verification script.

**Still to be uploaded from the F1–F4 review archive:**
- `data/rivers-semantics.js`: three distinct river markers per step, `sitsIn` data and arrow corrections.
- `data/authored-answer-index.js`: 62 original author answers used to prevent spoilers.

The complete and locally validated files are in **GeoWords_PR8_F1-F4_Fixes_Review.zip**, along with a single-line `apply_f4_patch.py` workflow.

The full F1–F4 verification was run locally with the complete archive:
`node scripts/validate-f4.mjs` → **PASS, 30,006 generated variants**.

GitHub CI currently remains green on its original workflow, **but that is NOT a validation of the complete F1–F4 patch** while the two data files are missing. Do not merge this PR until those files are uploaded and `node scripts/validate-f4.mjs` is added to PR CI.

## Once files are uploaded

Run from repository root:

```sh
node --check engine/semantic.js && node --check data/rivers-semantics.js && node --check data/dictionary.js && node --check data/courses.js && node scripts/validate-f4.mjs && node scripts/validate-generator.mjs && node scripts/validate-levels.mjs
```

Add to the `validate` job of `.github/workflows/pages.yml`:

```yaml
      - name: Validate F1-F4 semantic and vocabulary invariants
        run: node scripts/validate-f4.mjs
```

Then request Claude headless Chromium review of 320/360px map markers and arrows, semantic disambiguation, 1+6 progression, offline cache and Mountains regression. Approval of the vocabulary and descriptions by the author remains a separate requirement. The global L1→L2 curriculum is not implemented yet.

Do not merge without new review.
