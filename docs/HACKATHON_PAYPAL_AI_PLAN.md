# PayPal AI Hackathon — Global Stock implementation plan

Target deadline: 12 November 2026. Work on branch `feature/paypal-ai-hackathon`; do not merge into `main` until tests and owner review pass.

## Product direction

Global Stock remains an Argentina-first inventory and business-management product. Global Intelligence becomes the conversational front door for safe business workflows, with text first and voice interaction layered on top. PayPal is an opt-in checkout provider for eligible online-store orders in supported currencies, not a replacement for Argentine cash, bank transfer, cards, or local PSPs.

## Hackathon demo journey

1. The merchant asks Global Intelligence (typed or spoken) to identify low-stock products and prepare a restock suggestion.
2. The assistant uses verified application data and shows an editable draft; it does not invent supplier quotes or claim to have executed actions.
3. The merchant reviews and confirms the online order/checkout action.
4. For an eligible online-store order, the server creates a PayPal Checkout order in Sandbox, returns the official approval URL, and captures only after the buyer approves.
5. The application verifies PayPal's server response before recording a payment as captured. Duplicate/ambiguous captures must be idempotent and reconciled, not blindly retried.
6. Demo the same agent opening the relevant module, summarizing the result, and speaking the answer when the user enabled audio.

## Workstreams

### P0 — Safety and eligibility
- Verify the official hackathon rules, entry requirements, deliverables, IP terms, and country eligibility.
- Keep this work on a feature branch with a separate Vercel Preview deployment.
- Never place provider secrets in client code, mobile bundles, logs, or prompts.
- All tool execution must enforce authenticated user, active business membership, role permissions, server-side validation, and auditability.
- AI context and imported documents are untrusted data, never instructions.
- Read-only queries may execute directly. Changes, fiscal issuance, checkout, payment capture, refunds, and other financial/legal actions require explicit user confirmation.

### P1 — Global Intelligence agent
- Keep the current text chat working.
- Add voice input through browser/native speech APIs only where supported; keep a typed fallback.
- Add optional text-to-speech with explicit enable/mute control and no automatic playback of sensitive business information.
- Build an allowlisted tool registry with schemas, role checks, idempotency keys, audit events, and confirmation steps.
- First tools: open module, search/list stock, summarize sales, calculate restock draft, prepare document draft, and show pending tasks.
- Do not let the model issue arbitrary SQL, URLs, code, or direct provider requests.
- Fiscal document issuance must remain behind the existing fiscal provider, preflight checks, and explicit confirmation; never claim ARCA authorization without a verified CAE.

### P2 — Payments
- PayPal Checkout is optional and only for supported order currencies/eligible accounts. Use Sandbox by default.
- PayPal Orders API is for buyer checkout/merchant collection, not a generic supplier payout API. Supplier payouts require a separate eligible product and review.
- Keep Argentina-local payment options and existing checkout behavior unchanged.
- Store provider order/capture IDs and state server-side; verify amounts/currency against the stored order, not client-submitted totals.
- Add webhook signature verification and reconciliation before production launch.
- Do not enable live payments merely because credentials exist.

### P3 — Quality and delivery
- Run existing QA smoke tests, TypeScript, lint, build, web Playwright suite, and mobile Expo Doctor/typecheck/syntax checks.
- Add tests for AI tool authorization, confirmation gates, PayPal amount/currency mismatch, duplicate requests, cancellation, capture failure, and unavailable provider.
- Record a short demo, setup guide, architecture summary, and known limitations.

## PayPal server environment

Sandbox first:
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENV=sandbox`
- `NEXT_PUBLIC_APP_URL=https://<preview-host>`

Live credentials must be configured only after eligibility, business account availability, compliance, webhook verification, and owner approval are confirmed. Never commit values.

## Provider strategy

- Argentina beta: keep local payment methods as the default. Integrate Mercado Pago only through its official server-side API and verify Argentina-specific merchant eligibility.
- Hackathon demo: PayPal Sandbox checkout for eligible online-store orders in a supported currency; no hard-coded exchange rate and no automatic conversion of ARS.
- Other providers: use a provider-neutral adapter pattern; do not add multiple live integrations before one complete, tested flow exists.

## Definition of done

- No changes to `main` until reviewed.
- Demo can show the full flow without live charges.
- Server verifies auth, business membership, stored amount/currency, PayPal approval/capture response, and idempotency.
- Voice features degrade gracefully to typed chat.
- No unsupported claims that the assistant has created fiscal invoices, paid suppliers, or changed stock.
- README and demo instructions state what is real, Sandbox-only, mocked, or not yet available.
