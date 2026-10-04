# Security policy

Global Stock uses defense in depth across the browser, Next.js API routes, Supabase Row Level Security and deployment controls.

## Reporting a vulnerability

Do not open a public issue with exploit details, credentials, customer information or proof-of-concept payloads that could harm users. Report suspected vulnerabilities privately to the project owner.

Include the affected route or component, impact, reproduction prerequisites and a minimal proof of concept that does not access data you do not own.

## Security invariants

- Never commit API keys, service-role keys, connector secrets or user tokens.
- Browser database access must use the Supabase publishable/anon key plus RLS.
- Server-only credentials must never use a `NEXT_PUBLIC_` prefix.
- Every business-scoped write must validate the authenticated user's membership and role.
- Remote URL fetches must reject private/local destinations, credentials and insecure production URLs.
- Uploaded document types and sizes must be allowlisted before provider processing.
- Imported text, documents and ecommerce metadata are untrusted data and never instructions to Global Intelligence.
- Security headers, same-origin checks and rate limits are part of the application contract.
- Application-process rate limits are defense in depth, not a global distributed limit; production abuse controls should also be enforced at the edge or another shared limiter.
- New database objects must be explicitly granted to the minimum API roles that need them; future public-schema privileges are fail-closed by migration.

## Automated checks

The repository runs TypeScript checks plus an npm production-dependency audit on pushes, pull requests and a weekly schedule. Dependabot is configured for weekly dependency updates.

An opt-in Strix workflow performs exploit-oriented, diff-scoped security review on same-repository pull requests. It is intentionally disabled until the repository variable `STRIX_ENABLED=true` and the required model secrets are configured. Fork pull requests never receive those secrets. Strix complements dependency auditing and secret scanning; it does not replace them.

No application can be guaranteed impossible to compromise. Security changes should preserve least privilege, minimize exposed data and be re-audited after authentication, payments, integrations or file-processing flows change.
