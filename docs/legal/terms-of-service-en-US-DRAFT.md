# Terms of Service — English (company-approved final text)

> **Status: FINAL, provided directly by the company** — not a machine
> translation of the Portuguese seed, and not pending legal review the
> way the rest of this folder is. This superseded the old AI-assisted
> draft that used to live at this path.
>
> **Not live anywhere yet.** A first attempt to ship this added a
> `locale` column to the `terms_of_service` Supabase table (so pt-BR and
> en-US could each have their own active version) plus matching changes
> to `TermsOfService.tsx`, `Signup.tsx`'s acceptance-recording query, and
> the admin dashboard's Terms of Service tab. That was descoped for now
> — schema migration + admin UI changes + correctly scoping
> `terms_acceptances` by locale added more surface area than felt
> worthwhile to land in one pass. See `README.md` in this folder for the
> fuller writeup and what's needed to pick it back up.
>
> This file exists so the approved text isn't lost in the meantime.
> When localization is revisited, this is the content to seed.

---

## TERMS OF SERVICE

**TUKANA AI LTDA**, a limited liability business company (sociedade
empresária limitada) enrolled with the Brazilian Corporate Taxpayer
Registry (CNPJ) under No. 68.511.834/0001-03, with registered offices at
Rua Acelino Grande, No. 110, Casa 03, Condomínio Castel Novara, Santa
Felicidade, Curitiba, State of Paraná, Brazil, ZIP Code 82.320-130
(hereinafter "Tukana AI").

### 1. Acceptance of the Terms

By accessing or using the Tukana AI platform (the "Platform"), available
at https://fuzen.online, you (the "User" or the "Client") agree to be
bound by these Terms of Service. If you do not agree with any provision
set out herein, please do not use the Platform.

Tukana AI is an intelligent document and business process management
platform, developed to assist companies, law firms and financial
advisors with the organization, access control and traceability of
documents in M&A transactions and other corporate deals.

### 2. Registration and Account

To use the Platform, the User must create an account by providing true
and complete information. The User is responsible for the
confidentiality of its credentials and for all activities carried out
under its account. The User must immediately notify Tukana AI of any
unauthorized use. Each account is for individual or corporate use
according to the plan contracted, and the assignment or improper sharing
of credentials is not permitted.

### 3. Plans and Payment

Tukana AI offers subscription plans with limits on users (seats), active
cases and storage, as defined in each plan.

**3.1 Billing.** Payment is recurring, monthly or annual, and charged in
advance. Failure to pay may result in suspension or termination of
access.

**3.2 Price adjustments.** Tukana AI may adjust prices upon 30 (thirty)
days of prior notice. Continued use implies acceptance of the new
amounts.

**3.3 Cancellation and refunds.** The Client may cancel at any time,
taking effect at the end of the period already paid for. There is no pro
rata refund, except in the cases provided for in the Brazilian Consumer
Protection Code (Federal Law No. 8,078/1990).

### 4. Usage Limits

Use is subject to the limits of the plan contracted. Active cases are
ongoing transactions that consume the quota of the plan; closed cases
are archived without consuming active quota. Excess use may result in
suspension or in the need for an upgrade. Storage is calculated on the
total volume of files uploaded, regardless of format.

### 5. Permitted and Prohibited Use

The User is prohibited from: using the Platform for illegal or
fraudulent purposes; uploading content that infringes copyright or third
party data without authorization; attempting to access the accounts of
other users; reverse engineering the software; using bots or scrapers
without authorization; and reselling or assigning access to unauthorized
third parties.

### 6. Intellectual Property

All rights in the Tukana AI Platform, including software, design,
trademarks, interfaces and documentation, are the exclusive property of
Tukana AI. The User retains all rights in the documents and data it
uploads. Tukana AI does not claim ownership over User content.

### 7. Availability and Support

Tukana AI uses its best efforts to keep the Platform continuously
available but does not guarantee uninterrupted availability. Scheduled
maintenance will be communicated in advance. Enterprise plans include a
service level agreement (SLA) set out in a specific contract.

### 8. Limitation of Liability

Tukana AI shall not be liable for indirect losses, loss of profits or
consequential damages. The total liability of Tukana AI is limited to
the amount paid by the Client over the last 3 (three) months of
subscription.

### 9. Termination

Either party may terminate upon written notice. Tukana AI may terminate
immediately in the event of a material breach. After termination, the
User has 30 (thirty) days to export its data.

### 10. Amendments to the Terms

Tukana AI may amend these Terms upon 15 (fifteen) days of prior notice.
Continued use after the amendments implies acceptance.

### 11. Governing Law and Venue

These Terms are governed by Brazilian law, in particular the Civil Code,
the Consumer Protection Code (CDC) and the General Data Protection Law
(LGPD, Federal Law No. 13,709/2018). The courts of the Judicial District
of Curitiba, State of Paraná, are elected as the competent venue.

### 12. Contact

tukanaai@gmail.com

---

## Also pending: updated Portuguese content

Separately, the company also wants the *live Portuguese* terms updated
to swap the contact email from `contato@fuzen.online` to
`tukanaai@gmail.com` (otherwise identical to the current seed content).
That's a much smaller change — a straightforward content edit to the
single active `terms_of_service` row — and doesn't depend on the locale
work above. It's on hold along with everything else in this file for
now, but doesn't need to wait on it.
