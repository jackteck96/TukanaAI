# Legal translation drafts — status

Tukana AI's public pages were internationalized (pt-BR / en-US / es-419) in
[date of this work]. Two pieces of legal content were **intentionally
left out of that rollout** and are not wired into the language
switcher yet:

- **Privacy Policy** (`src/pages/PoliticaPrivacidade.tsx`)
- **Terms of Service** (`src/pages/TermsOfService.tsx`)

## Why these weren't auto-translated and shipped

Machine/AI-translating binding legal text and publishing it without a
lawyer's sign-off is a real liability, not a UX nit — a mistranslated
liability clause, retention period, or data-subject right is worse
than staying Portuguese-only. So instead of wiring these into
`react-i18next` like the rest of the site, this folder holds **draft
translations for a lawyer to review**:

| File | Status |
|---|---|
| `privacy-policy-en-US-DRAFT.md` | Draft, unreviewed |
| `privacy-policy-es-419-DRAFT.md` | Draft, unreviewed |
| `terms-of-service-en-US-DRAFT.md` | Draft, unreviewed — **see DB caveat below** |
| `terms-of-service-es-419-DRAFT.md` | Draft, unreviewed — **see DB caveat below** |

## Important: Terms of Service content lives in the database, not the code

`TermsOfService.tsx` renders whatever the currently-active row in the
`terms_of_service` Supabase table contains — it doesn't hardcode any
terms text. The only Terms of Use text in the *repository* is the
default seed inserted by
`supabase/migrations/20251023191352_55f9c53e-ad1a-4f2f-a18b-bb083f3dede1.sql`.

The translations in `terms-of-service-*-DRAFT.md` were made from that
seed. **If the live terms have been edited since** (e.g. through an
admin UI), the draft translations are stale. Before finalizing:

```sql
select version, content from terms_of_service where is_active = true;
```

...and diff that against the seed content before treating the drafts
as current.

The Privacy Policy, by contrast, *is* hardcoded JSX in
`PoliticaPrivacidade.tsx`, so those two drafts were translated directly
from the live component and don't have this staleness risk — just the
normal "needs legal sign-off" one.

## Next steps for dev

1. Send the four draft files to Legal for review/wording confirmation.
2. Once approved, decide how Terms of Service should be localized:
   - **Option A:** add locale columns to `terms_of_service` (e.g.
     `content_en`, `content_es`, or a `content_i18n jsonb`), have
     `TermsOfService.tsx` select the column matching `i18n.language`.
   - **Option B:** keep one canonical (Portuguese) terms row and only
     show translated *static* UI chrome, with a note that the binding
     text is in Portuguese — simplest, avoids treating an AI
     translation of contract text as authoritative.
3. For Privacy Policy, once approved, move the approved copy into
   `src/locales/{en-US,es-419}/common.json` under a new `privacyPolicy`
   key (mirroring the section structure already in
   `PoliticaPrivacidade.tsx`) and wire the component with
   `useTranslation()`, same pattern as the rest of the site.
4. `PlansSection.tsx` (the pricing cards on the landing page) also
   pulled plan description / price label / features from the
   `subscription_plans` table, which has no locale columns — same
   category of problem as #2 above, but **not legal content**, so it
   didn't need to wait on legal sign-off. Fixed with a client-side
   catalog keyed by `plan.slug` in `src/locales/*/common.json`
   (`landing.plans.catalog.<slug>`), with `t(key, { defaultValue:
   plan.field })` so any future plan slug not yet in the catalog falls
   back to the raw DB text instead of breaking. Plan *names* ("Starter",
   "Growth"...) are kept as-is across locales, treated like product
   tier names rather than translated prose. If plans start changing
   often, revisit — a locale column/jsonb on the table would be less
   maintenance than keeping this dictionary in sync by hand.
