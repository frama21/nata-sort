# Feature: help

Static help page: privacy, browser requirements, where progress is stored, file
safety, and where to find keyboard shortcuts.

| | |
| --- | --- |
| **Routes** | `/help` (title "Bantuan", nav label "Bantuan") |
| **Public API** | none (no `index.ts`); reached only through its route |
| **Depends on** | `shared/components/ui/card` |
| **Depended on by** | nothing |

## Tests

```bash
pnpm vitest run src/features/help        # unit
pnpm playwright test src/features/help   # e2e
```

## Removing it

Delete `src/features/help/`. Route discovery drops `/help` and the nav link.
Nothing else imports this feature. Removal was verified: typecheck,
architecture check, the remaining Vitest suites, and the build all pass.

The app-level navigation E2E test (`src/app/tests/e2e-test/navigation.spec.ts`)
clicks the "Bantuan" link, so update that test if you remove this feature.
