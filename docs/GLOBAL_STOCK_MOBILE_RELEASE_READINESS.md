# Global Stock — Mobile release gates and non-generic design audit

Updated: 2026-10-11. **Not a legal opinion or authorization to operate.**
Scope: React Native + Expo Go / Android / iOS, with Next.js web as the
reference implementation. Keep web and native functionality independent;
share tenant-scoped data using Supabase RLS.

## Grounded status

| Area | Current engineering status | Before public release |
| --- | --- | --- |
| Mobile email/password identity | Supabase authenticated session; AI request revalidates user and retries refresh | On-device login/expiry/restore tests; account recovery; MFA flow |
| Application profile | Own-profile recovery before AI request, RLS protected | Test with newly registered users, old users, and revoked sessions |
| Age eligibility | 18+ self-attestation on registration and versioned terms acceptance | Actual jurisdiction-specific eligibility policy; age verification if required; no claim that self-attestation verifies age |
| Terms/privacy/security | Public versioned documents and links, recorded acceptances | Legal counsel reviews each country and each updated policy; local-language documents and valid contact details |
| Business data/AI | Per-business RLS and explicit, revocable AI-context consent | Data processor contracts; deletion/retention review; assess international data transfer; opt-out test |
| Account deletion | Native verified-email + exact-phrase RPC (same flow as web) | Two-business ownership tests, shared-business ownership transfer, store reviewer test |
| Stocks | Shared products and live refresh | Race, offline conflict, tenant-isolation and rollback tests |
| POS/payments | Only local sale drafts in Expo | Native transactional checkout, refunds, receipts and real PSP compliance; prohibit live payments until reviewed |
| Agenda/proveedores | Native records merged with web workspace | Concurrent edit conflict tests and CRUD regression |
| AI | Native Global Intelligence conversation | Provider availability/error tests, costs, abuse protection and output reliability; no fabricated commercial forecasts |
| Forex | Web DolarHoy/exchangerates APIs | Provider terms/licensing, non-live/staleness labels, usage/caching policy, financial-information disclaimer |
| Native push | Not enabled | Opt-in, authorization, notification preferences and platform permission tests |
| OCR/fiscal receipts | Not complete natively | Country-specific invoicing, tax and archiving integrations |
| Ecommerce integrations | Some native read-only screens; web controls | OAuth/token ownership, scoped permissions and secure credential storage; real integration tests |
| Languages | ES primary; partial EN/PT/FR/DE preference | Full translated interface/legal copy and locale-aware date/currency, fonts and review |
| Design | Compact dark/red controls, dock, native sheets | iPhone SE/12/Pro Max, iPad and Android device/accessibility audits |
| Accessibility | Some accessibility labels, buttons and touch targets | VoiceOver/TalkBack, Dynamic Type, focus, contrast, low-motion, orientation tests |

## Intended geographic review

The currently contemplated destinations are **Argentina, Brazil, Mexico,
United States, Spain, United Kingdom and Germany**. Jurisdictional requirements
may apply based on the *user's residence and location*, data subject location,
local business presence, payment service and vendor arrangements, not only the
map pins shown on the marketing site.

| Country / area | Topics to verify with specialist counsel *before launch* |
| --- | --- |
| Argentina | Personal data protection; local consumer disclosures; fiscal documents (including AFIP/ARCA requirements as applicable), subscription and refund rules |
| Brazil | LGPD data-controller/processor duties; Portuguese disclosures; minors' data and legal capacity; payments, invoicing and local tax obligations |
| Mexico | Mexican privacy/ARCO rights regime; commercial terms, refunds and invoicing (SAT/CFDI as applicable) |
| United States | State-by-state consumer/privacy laws; children and minors, payment/auto-renewal terms, tax nexus and sales-tax obligations |
| Spain | EU GDPR, LOPDGDD, consumer and digital service rules, electronic invoicing and applicable EU digital platform obligations |
| United Kingdom | UK GDPR and Data Protection Act duties; cancellation and consumer rules, cross-border data transfers and tax responsibilities |
| Germany | EU GDPR/BDSG, consumer contract requirements, local commercial disclosures and invoicing obligations |

The table is a **review checklist**, not a country compliance certificate.
Do not assert Global Stock operates legally in every country because it has
a published terms page or an age checkbox. Confirm age policy with counsel;
18+ is a *product policy choice*, not the universal legal threshold worldwide.

## Apple-style interaction review (emilkowalski/skills)

Sources requested by the product owner:
- https://github.com/emilkowalski/skills/blob/main/skills/apple-design/SKILL.md
- https://github.com/emilkowalski/skills/blob/main/skills/improve-animations/SKILL.md
- https://github.com/emilkowalski/skills/blob/main/skills/review-animations/SKILL.md

Use principles, not copy-pasted web code in React Native:
- Reduce cognitive load: 4 KPI cards + one important chart above the fold.
- Separate Settings into short topical tabs; hide secondary detail until requested.
- Calm red highlights with a single active primary action; avoid repetitive all-caps labels.
- Provide immediate pressed-state feedback and ~44pt interactive targets.
- Keep navigation labels consistent even with larger accessibility text.
- No gratuitous entrance animation on every tab; respect Reduce Motion.
- Pressable/modal/sheet interactions must be reversible and interrupted cleanly.
- Keep heavy charts off render hot-path; memoize calculations; no 3D while editing a sale.
- Put error messages next to the action, with a real remedy; never disguise a business
  permission denial as an expired session.
- Native mobile != literal responsive webpage: prioritize safe area, keyboard and
  scroll access without squeezing a full desktop layout into an iPhone.

## Release blockers

1. Obtain valid CI executions for the **latest** Git commit. A run that fails
   before any job steps is not proof of project success or failure.
2. Verify Global Intelligence end to end with a real signed-in test account
   and owner/member/business permission combinations.
3. Reconcile all still-web-only features one by one, with working mobile
   implementations and tests. **Do not mark modules complete just because
   a menu item opens a webpage.**
4. Manual device UX and screen-reader checks; no production transactions
   until legal, security and payment review is complete.
5. Native store releases require privacy nutrition labels/data safety,
   account deletion discoverability, support, terms and valid publisher data.

## Controls and data handling

- Keep `service_role`, payment webhook secrets and provider API keys server-side.
- Never send another tenant's inventory to AI; require explicit consent, revocable
  and honored server-side.
- Avoid silent web/mobile overwrites: concurrent workspace writes must be tested
  for note/supplier loss.
- A deletion request must delete the authenticated account in the app after explicit
  confirmation; do not substitute sending an email to support.
- Keep server-side age/legal acceptance timestamps and versions, without claiming
  identity verification.
