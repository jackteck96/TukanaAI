# Legal translation drafts — status

Tukana AI's public pages were internationalized (pt-BR / en-US / es-419) in
[date of this work]. Two pieces of legal content were **intentionally
left out of that rollout** and weren't wired into the language switcher at
the time:

- **Privacy Policy** (`src/pages/PoliticaPrivacidade.tsx`)
- **Terms of Service** (`src/pages/TermsOfService.tsx`)

## Why these weren't auto-translated and shipped

Machine/AI-translating binding legal text and publishing it without a
lawyer's sign-off is a real liability, not a UX nit — a mistranslated
liability clause, retention period, or data-subject right is worse
than staying Portuguese-only. So instead of wiring these into
`react-i18next` like the rest of the site, this folder originally held
**draft translations for a lawyer to review**, made by translating the
live Portuguese content.

| File | Status |
|---|---|
| `privacy-policy-en-US-DRAFT.md` | **Superseded.** Company provided its own final English text (not a translation of this draft) — live at `src/pages/PrivacyPolicy.tsx`, route `/privacy-policy`. Kept for history only. |
| `privacy-policy-es-419-DRAFT.md` | Draft, unreviewed |
| `terms-of-service-en-US-DRAFT.md` | **Company-approved final text, not yet live.** No longer an AI translation — see "Terms of Service: localization descoped for now" below. |
| `terms-of-service-es-419-DRAFT.md` | Draft, unreviewed — content translated from the DB seed migration below; re-diff against the live active row before treating it as current. |

## Privacy Policy: hardcoded JSX, now has a separate English page

`PoliticaPrivacidade.tsx` hardcodes Portuguese JSX and is unchanged —
still has its own unfilled placeholders (`[Inserir CNPJ]`, etc.), still
served at `/politica-privacidade`.

The company's approved English text didn't need those placeholders filled
in the same way, so rather than trying to force it into the PT page's
`useTranslation()`-driven structure, it shipped as its own page:
`src/pages/PrivacyPolicy.tsx`, route `/privacy-policy`. The footer and the
signup consent checkbox (`Auth.tsx`) link to whichever one matches
`i18n.language`.

## Terms of Service: localization descoped for now

`TermsOfService.tsx` renders whatever the active row in the
`terms_of_service` Supabase table contains — it doesn't hardcode terms
text, and the table is still Portuguese-only (no locale column). The
default seed is in
`supabase/migrations/20251023191352_55f9c53e-ad1a-4f2f-a18b-bb083f3dede1.sql`.

The company provided its own final English Terms of Use (not a
translation of that seed) — see `terms-of-service-en-US-DRAFT.md` in this
folder. A first pass tried to ship it by adding a `locale` column to
`terms_of_service` (Option A below) with matching changes to
`TermsOfService.tsx`, `Signup.tsx`'s acceptance-recording query, and the
admin dashboard's Terms of Service tab. That was **descoped for now** —
schema migration + admin UI changes + correctly scoping
`terms_acceptances` by locale (so an acceptance record actually matches
the language the user was shown) was more surface area than felt worth
landing in one pass. All of that was reverted; the live DB and the
component are back to their original Portuguese-only state.

When this gets picked back up, the two options are still:

- **Option A:** add a `locale` column to `terms_of_service` (uniqueness
  scoped to `(version, locale)` instead of just `version`), have
  `TermsOfService.tsx` and `Signup.tsx` filter by
  `i18n.language.startsWith('en') ? 'en-US' : 'pt-BR'`, and extend the
  admin dashboard's terms tab with a language selector — including fixing
  `handleActivateTerms` to deactivate only the same-locale row, not every
  row. This is the version that was built and then reverted; it worked,
  it just needs a deliberate pass rather than a same-session add-on.
- **Option B:** keep one canonical (Portuguese) terms row and only show
  translated *static* UI chrome, with a note that the binding text is in
  Portuguese — simpler, avoids the acceptance-tracking correctness
  question above entirely.

Separately, and not blocked on either option: the company also wants the
live Portuguese terms content updated to use `tukanaai@gmail.com` instead
of `contato@fuzen.online`. That's a plain content edit to the single
active row, no schema change needed.

## Still open

- `es-419` translations for both documents remain unreviewed drafts, not
  wired in anywhere.
- `PlansSection.tsx` (the pricing cards on the landing page) had the same
  "content lives in a locale-less DB table" problem as Terms of Service,
  but for plan descriptions/features rather than legal text — so it didn't
  need to wait on legal sign-off. Fixed with a client-side catalog keyed by
  `plan.slug` in `src/locales/*/common.json`
  (`landing.plans.catalog.<slug>`), with `t(key, { defaultValue:
  plan.field })` so any future plan slug not yet in the catalog falls back
  to the raw DB text instead of breaking. Plan *names* ("Starter",
  "Growth"...) are kept as-is across locales, treated like product tier
  names rather than translated prose. If plans start changing often, a
  locale column/jsonb on `subscription_plans` (same shape as the
  `terms_of_service.locale` fix above) would be less maintenance than
  keeping this dictionary in sync by hand.
