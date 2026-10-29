# Global Stock — PayPal AI Hackathon submission kit

**Working title:** Global Stock Intelligence — Voice-first business operations with PayPal

## Short description

Global Stock is an Argentina-first business-management application. The current hackathon branch adds a unified demo workspace with Argentine sample inventory, Spanish-Argentina voice dictation, and a fixed-price PayPal Developer Sandbox checkout. The dedicated demo is isolated from real businesses and real money. This is an implementation checkpoint, not yet a final hackathon submission: the PayPal checkout still needs to be tied to a genuinely AI-assisted, reviewable store-order workflow before it can be described as fundamental to the product.

## Problem

Small retailers lose time moving between stock lists, sales reports, supplier orders, and payment screens. Many owners do not have time to learn every module of a business-management tool. A conversational assistant can make common workflows easier—but only if it uses real business data, respects roles, and verifies actions rather than merely generating plausible text.

## Proposed solution

Global Stock combines inventory management with Global Intelligence. The existing authenticated assistant can use authorized business context; the hackathon branch adds voice dictation and a focused, isolated demo route. The demo checkout uses real PayPal Sandbox API traffic with a server-fixed amount and validated capture, but it is currently a separate test purchase. Do not claim the required AI-to-PayPal workflow is complete until the assistant and checkout share a verified order/cart flow.

## What changed during the hackathon

The branch feature/paypal-ai-hackathon contains dated commits after 1 October 2026. Implemented changes currently include:
- Replaced unrelated fishing-store demo fixtures with neutral Argentine small-business sample inventory.
- Added a unified /hackathon-demo page in Global Stock's visual language, with sample stock, voice dictation, and an explicitly isolated checkout demonstration.
- Added server-only PayPal Developer Sandbox order creation/capture endpoints with a fixed USD 19.99 amount, order ownership checks, and no browser-supplied amount.
- Added optional es-AR dictation to the existing Global Intelligence chat with typed fallback.
- Added regression tests and Sandbox setup documentation.

**Still required before submission:** make PayPal checkout part of a genuinely AI-assisted order/cart workflow, test the full checkout and cancellation flow using Sandbox buyer accounts, run all release/type/build checks after the Next.js 16.4.3 security patch and verify the final judge experience. Do not list any unfinished item as delivered.

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
