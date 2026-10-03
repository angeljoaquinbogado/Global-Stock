# Global Stock — Public UI design contract

This document is the project-level design contract for the public storefront and download experience.

It distills the design-review principles used from:
- dickwu/apple-design-skill
- emilkowalski/skills

The source skills remain external. This file translates the useful rules into Global Stock-specific decisions so future edits stay consistent.

## Product thesis

Global Stock is a business control system that connects sales, inventory, purchasing, suppliers, finance, ecommerce, team roles, and operational intelligence.

The public site has one job: make that connected operation understandable in seconds and give people a confident path to open or install the app.

## Brand point of view

The design should not read like a generic dark SaaS template.

Global Stock's signature is the connected operational signal:
- sale enters once
- stock updates
- cash movement follows
- ecommerce can synchronize
- intelligence gets context

The phone/product preview is the bold visual moment. Everything around it stays quieter.

## Color roles

Use color semantically, not decoratively.

- Brand / primary action: #C91527
- Stock / success: #34D399
- Sales / finance: #F6B95B
- Connectivity / platform: #6EA8FF
- Intelligence / AI: #B989FF
- Cyan operational accent: #50C7D9
- Primary background: #070708
- Raised surface: #111217
- Raised-hover surface: #16171C
- Primary text: #F5F5F7
- Secondary text: #A8A8B0

Do not turn every border, icon, label, and headline red. Red is reserved for brand actions and the main brand signature.

## Typography

Use the system stack already defined in app/globals.css.

Hierarchy:
- Hero display: clamp(3.4rem, 6vw, 6.8rem), tight tracking
- Section display: 2.25rem to 3.75rem depending on width
- Subhead: 1.5rem to 2rem
- Body: 1rem minimum for reading copy
- Utility labels: 10–13px only when secondary and high-contrast enough

Avoid thin weights for small text.

## Layout

Desktop:
- max content width: 1240px
- primary hero: two columns
- editorial sections: asymmetric split where useful
- main cards use spacing and surfaces before borders

Compact:
- one column
- no fixed-width content that overflows
- controls keep at least 44px touch height
- horizontal selectors hide native scrollbars and remain operable by touch

Progressive disclosure wins over density.

## Components

Buttons:
- 44px or taller for primary touch targets
- press feedback from the global 140ms transform token
- primary button uses brand red
- secondary buttons use neutral surfaces

Segmented selectors:
- use only for closely related choices
- keep the group visually compact
- selection state must be obvious without relying only on color
- platform selector may keep platform icons because they improve recognition across Windows, iOS, and Android

Icons:
- Lucide is the default system
- keep stroke language consistent
- app logo is /icons/icon-512.png
- do not replace the logo with decorative artwork

Cards:
- prefer surface contrast over white rectangle outlines
- use subtle separators only when they explain grouping
- avoid a wall of equal-sized cards

## Motion

Existing motion tokens in globals.css are authoritative:
- --ease-out: cubic-bezier(0.23, 1, 0.32, 1)
- --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)
- --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)

Rules:
- frequent hover feedback: 150–180ms and subtle
- state transitions: 180–220ms
- marketing entrance: 500–650ms is acceptable because it is rare
- avoid ease-in
- avoid transition: all
- use transform and opacity for movement
- accordion height animation is the accepted exception
- Framer Motion uses full transform strings for moving elements
- reduced motion must keep meaning while removing movement
- hover motion is gated to hover:hover and pointer:fine

## Accessibility

- visible focus remains mandatory
- never communicate meaning by color alone
- touch controls are 44px minimum where practical
- body copy must remain readable at 200% zoom
- layouts must survive narrow mobile widths
- no hidden essential action behind hover
- motion cannot be the only indicator of a state change

## Restraint checklist

Before adding UI:
1. Does it explain the product?
2. Does it help the user choose or act?
3. Does it improve orientation?
4. Would the page lose meaning without it?

If all answers are no, remove it.

Before adding motion:
1. Is the purpose feedback, state indication, spatial consistency, explanation, or preventing a jarring change?
2. Is the frequency low enough?
3. Can it stay brief?
4. Can it be reduced for accessibility?

If not, keep the change instant.
