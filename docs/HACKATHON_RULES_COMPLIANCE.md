# PayPal AI Hackathon — rules compliance and submission checklist

Last reviewed against the official rules supplied by the project owner on 27 October 2026.

## Hard requirements

- [ ] Register for the event through Devpost and submit before **12 November 2026, 12:00 p.m. Pacific Time**. Do not assume a local-time conversion.
- [ ] Confirm individual eligibility and all required identity/tax documentation. The rules require participants to have reached the age of majority where they reside. Do not treat this checklist as legal advice.
- [ ] Build or significantly update an existing app after 1 October 2026. Preserve evidence of the dated changes: feature branch, commits, release notes, screenshots and demo.
- [ ] Use PayPal Developer Sandbox and an AI model/tool in a way that is fundamental to the demonstrated product. A PayPal logo, static mockup, or unrelated checkout link is not sufficient.
- [ ] Make the project install and run consistently. Provide either a working hosted demo or complete build/run/test instructions.
- [ ] Keep the repository public and open source, include a recognized open-source license, and confirm the license is visible in GitHub's repository About area.
- [ ] Provide an English submission description, English test/setup instructions, and English captions/subtitles or translation for any non-English demo video/material.
- [ ] Publish a public YouTube demo video **under 3 minutes** showing the working product on its intended device(s), and include its URL in Devpost.
- [ ] Ensure the submitted project is original, owned by the entrant, and respects all third-party SDK/API/data licenses and trademark/copyright permissions.
- [ ] Keep the demo available and free for judges to test through the evaluation period (1–15 December 2026). Include clearly scoped sandbox credentials/instructions if required; never expose production secrets.
- [ ] Submit all required Devpost fields before the deadline. A draft is not a submitted entry.

## Project scope

**Global Stock / Global Intelligence** remains an Argentina-first business management product. The hackathon update will focus on a demonstrable agent workflow: the user asks in natural language or voice for business insight, the agent reads authorized business context, prepares a restock/order action, explains the result, and—when appropriate—hands off to a PayPal Sandbox checkout flow with explicit user approval.

PayPal must be central to the demonstrated workflow, not a superficial add-on. Do not claim supplier payout functionality from PayPal Checkout: buyer checkout and supplier disbursements are different products and require separate eligibility/API review.

## Production safety

- All hackathon code belongs on `feature/paypal-ai-hackathon` and a Vercel Preview deployment until tests and owner review pass.
- Do not commit secrets, real customer data, service-role keys, production PayPal credentials, or judge passwords to the repository.
- Sandbox is the default. Do not enable live payments as part of this hackathon branch.
- Preserve the Argentina-local payment methods and current production behavior. PayPal is optional and must not silently change ARS orders or hard-code exchange rates.
- All writes must use authenticated server routes, business membership/role authorization, validated server-side totals, idempotency, and auditable outcomes.
- Fiscal issuance, payments, refunds, and stock changes require explicit confirmation. The assistant must not claim an action succeeded until the server/provider confirms it.
- Imported data and model output are untrusted. The model must not receive arbitrary SQL, arbitrary network access, or permission to bypass application authorization.

## Design requirements for new UI

Follow Apple's Human Interface Guidelines as a design reference without copying Apple branding:
- Prefer native-feeling, calm layouts, clear hierarchy, readable system typography, and generous but efficient spacing.
- Use rounded controls with restrained materials, subtle motion, and clear pressed/focus/disabled states.
- Use the existing Global Stock design tokens, theme, and user-selected accent; never hard-code a new red or replace the user's chosen accent.
- Buttons must have concise labels, accessible names, keyboard/focus support, and predictable behavior.
- Voice must always have a visible recording/listening state, an obvious stop/cancel action, and a text fallback. Never record continuously or play sensitive answers aloud by default.
- Respect reduced motion, small mobile screens, safe areas, contrast, and light/dark mode.
- Avoid decorative controls that do nothing, generic Apple logos/marks, or a design that makes the app look like an Apple product.

## Demo acceptance test

The recorded demo must show, end to end:
1. A real Global Stock session or clearly labeled safe demo environment.
2. A voice or typed request to Global Intelligence.
3. A result grounded in available business data.
4. An editable restock/order draft with the calculation visible.
5. Explicit confirmation and PayPal Sandbox approval flow.
6. A verified final status, including a truthful failure/cancel path if relevant.
7. The same flow in the intended responsive UI, not a static mockup.

Do not record a video until the flow is actually working. Mark every simulated or Sandbox-only behavior clearly.
