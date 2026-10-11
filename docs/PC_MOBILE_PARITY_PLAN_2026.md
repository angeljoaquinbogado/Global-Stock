# Global Stock — parity plan for iPhone / Android / PC

Status: progressive integration, **not complete**. Last updated 2026-10-11.

## Single business data source

- Existing mobile Expo Go and PC Next.js use the same Supabase `global_stock_businesses`, `global_stock_products`, memberships and roles.
- Names, SKU, manual barcodes, category, stock and price must refer to the same business ID. A device does not gain access to another business by supplying an ID; Supabase RLS and privileged RPC checks remain authoritative.
- The mobile creation flow now allows retail, wholesale, restaurant, services, manufacturing and other industries; there is no industry-specific hard restriction on the product catalog.
- Manual barcode entry in Expo Go matches EAN/UPC and business SKUs with leading zeroes preserved; only authorized members may create products.

## What is NOT yet identical

The native workspace and existing PC Next.js dashboard are two separate interface implementations. Database synchronization is NOT UI equivalence. Do not promise identical design, controls or every module until verified on both platforms.

| Capability | Expo Go mobile | Existing PC web | Remaining work |
| --- | --- | --- | --- |
| Authorized business/product records | Shared Supabase | Shared Supabase | Negative tests with 2 users / 2 businesses |
| Product search by code/SKU | Manual and camera | Search/catalog UI | Match the same code-entry workflow |
| New stock products | Mobile limited fields | Web catalog | Match field validation, edit/delete and category tools |
| Analytics / sales | Native subset | More complete modules | Shared permissions, metrics, labels and history |
| Language, themes and design | Native theme | Independent web theme | Shared design tokens and copy; viewport QA |
| Business-specific workflows | Generic stock foundations | Various advanced modules | Adapter modules for food, manufacturing, services, wholesale |
| AI | Native chat calling authenticated web API | Web chat calling authenticated API | Independent provider quota/budget, reliable failover with user-approved funding |

## Architecture proposal for exact app parity

Do not rewrite or overwrite the public promotional site. Create a **single application UI** shared across phones and PC, starting from the stable mobile workspace (Expo/React Native), with a web platform target via React Native Web / Expo Web or a shared cross-platform component library.

1. Move business data contracts, navigation definitions, permissions and design tokens into versioned cross-platform modules.
2. Add platform adapters: secure session storage, offline database, camera/barcode, printing and keyboard shortcuts. Do not call native-only Expo APIs on web without capability checks.
3. Make responsive shared pages for Home, Inventory, Scanner/manual code, POS/drafts, Charts, Activity, AI and Settings. Only then migrate the less mature modules.
4. Add two-client contract tests to demonstrate updates propagate from mobile to PC and vice versa, and tests for business isolation.
5. Run automated web responsive QA and physical iOS/Android QA. Consider an installable Windows shell only after web parity passes.
6. Keep feature flag rollout so a new PC app never silently replaces the current live web system.

## Release gates

- Expo Go: start → login → hamburger → AI → manual SKU search → product creation → logout → login; no blank screens.
- Same user & business on PC/mobile: verify products and quantities after refresh in both directions; drafts are NOT sales.
- Every mutation observes server-side RBAC and RLS. Existing offline drafts are not auto-synced or posted as paid sales.
- Real AI answers must use an actually available provider. Accurate native clock lookup is a utility, not proof the external LLM quota works. Budgeted secondary provider requires explicit owner approval before incurring charges.

This file is a contract/plan, **not a statement that desktop/mobile UI parity is already delivered**.
