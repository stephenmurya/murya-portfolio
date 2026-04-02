# Palmer Behaviors

## Confirmed behaviors
- Fixed header that translates upward after scroll.
- Floating right-side social button.
- Floating "Use for Free" CTA.
- Repeated rolling-text button labels composed from per-letter spans.
- Sticky sections in the later half of the page, especially testimonial / gallery-style blocks.
- Hover and transition styling on interactive pills, nav links, and cards.

## Interaction model summary
- Navigation: fixed, scroll-reactive.
- Hero: mostly static layout with embedded media.
- Work / awards / journal: scroll-driven editorial reveal through spacing, stagger, and sticky positioning.
- CTA pills: hover-driven styling and rolling text treatment.
- Footer: static with back-to-top anchor.

## Implementation note
- The clone in this repo preserves the extracted rendered DOM and CSS so the visual behavior matches the captured Framer output as closely as possible without reintroducing Framer runtime scripts.
