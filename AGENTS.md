# GeoWords engineering rules

- Mobile-first PWA. Preserve installability and offline shell.
- New learning content must be data, not bespoke code.
- Keep location coordinates in percentages relative to the source map.
- Store localized clue/descriptors as complete phrases; do not generate Russian grammar from templates.
- Do not couple curated levels to generated-practice logic.
- Preserve one-handed phone usability; test zoom/pan/tap interactions on narrow viewports.
- No payment/auth complexity in MVP changes unless explicitly requested.
- Every behavior change should include a reproducible manual test note in the PR description.
