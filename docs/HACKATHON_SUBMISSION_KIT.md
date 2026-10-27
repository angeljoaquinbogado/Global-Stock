# Global Stock — PayPal AI Hackathon submission kit

**Working title:** Global Stock Intelligence — Voice-first business operations with PayPal

## Short description

Global Stock Intelligence helps small businesses manage inventory and purchasing through natural-language and voice interactions. Instead of navigating multiple screens, a merchant can ask for low-stock insights, review a suggested restock, and continue through a confirmed PayPal Sandbox checkout when the order and merchant account are eligible. The agent uses authorized application context, explains its recommendations, and keeps the merchant in control of financial actions.

## Problem

Small retailers lose time moving between stock lists, sales reports, supplier orders, and payment screens. Many owners do not have time to learn every module of a business-management tool. A conversational assistant can make common workflows easier—but only if it uses real business data, respects roles, and verifies actions rather than merely generating plausible text.

## Proposed solution

Global Stock Intelligence combines a business-management application with a tool-using AI assistant. The assistant can interpret typed or spoken requests, summarize permitted inventory and sales data, prepare a reviewable restock draft, and guide the user into an eligible PayPal Sandbox checkout. PayPal is part of the actual demo journey; it is not merely a logo or an unrelated payment button.

## What changed during the hackathon

Global Stock existed before the event. The entrant must document the significant post-1 October 2026 changes with dated commits and a before/after summary. Planned work includes:
- An explicit, allowlisted agent action layer with authorization and confirmation gates.
- Voice input and optional speech output with accessible controls and typed fallback.
- A PayPal Developer Sandbox checkout workflow integrated with the agent's order/review journey.
- End-to-end tests and an English judge setup guide.

Only list an item as implemented after it has been completed and verified. Replace this section with the exact delivered changes and commit links before submission.

## Technology

- Web application: Next.js and TypeScript.
- Mobile application: React Native / Expo.
- Data and authentication: Supabase.
- AI: the configured server-side Global Intelligence provider.
- Payments: PayPal Developer Sandbox (no live money movement in the hackathon demo).

Update this section if the final implementation changes. Do not imply an integration is working merely because configuration or UI exists.

## Judge setup

1. Clone the public repository and follow the root README and the workspace README for the intended platform.
2. Install the documented Node.js dependencies.
3. Configure the required Supabase and AI environment variables in a local, untracked environment file.
4. Configure PayPal **Sandbox** credentials on the server only; never use a `NEXT_PUBLIC_` prefix for a secret.
5. Start the web application and sign in using a dedicated test account with no real customer data.
6. Follow the final test scenario and confirm that the PayPal environment is Sandbox.
7. If the public demo is used instead, use the public preview URL and the dedicated judge account instructions supplied in Devpost.

This setup section is a template. Before submission, replace placeholders with verified commands, exact environment variable names, a working demo URL, and safe judge credentials. Do not publish passwords or keys in this file or in Git history.

## Demo video plan (target 2:30, maximum 2:59)

- 0:00–0:20 — Explain the problem for a small retailer.
- 0:20–0:45 — Ask Global Intelligence by voice or text to find products that need restocking.
- 0:45–1:15 — Show the real data used and review/edit the draft.
- 1:15–2:00 — Confirm and complete the PayPal Sandbox checkout flow; show the verified status.
- 2:00–2:25 — Show the assistant summarizing the result and the responsive/mobile experience.
- 2:25–2:40 — Explain the safety controls and what was significantly built during the event.

Publish the video publicly on YouTube. Provide English narration or English subtitles/translation. Use only original or properly licensed visual/audio material; do not include third-party trademarks or music without permission.

## Submission checklist

- [ ] Official Devpost registration complete.
- [ ] Eligibility verified.
- [ ] Public repository and license visible in GitHub About.
- [ ] Significant post-1 October changes are real and evidenced.
- [ ] PayPal Sandbox and AI are both essential to the demonstrated workflow.
- [ ] Clean setup tested from a fresh clone.
- [ ] Public working demo or complete test instructions.
- [ ] Dedicated judge credentials are safe, limited, and work through evaluation.
- [ ] English description, test instructions, and demo translation/subtitles.
- [ ] Public YouTube video under 3 minutes.
- [ ] All required Devpost fields submitted before the deadline.
