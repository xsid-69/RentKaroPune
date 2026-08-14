# RentkaroPune Design System

## Direction
A bright, high-trust marketplace with the energy of Pune street signage translated into a disciplined digital product. White is the working canvas, charcoal carries authority, and orange is reserved for decisions, urgency, and financial actions.

## Tokens
- Canvas: `oklch(1 0 0)`
- Ink: `oklch(0.15 0 0)`
- Muted ink: `oklch(0.42 0.01 55)`
- Orange: `oklch(0.67 0.22 42)`
- Orange dark: `oklch(0.55 0.2 38)`
- Border: `oklch(0.9 0.006 55)`
- Success: `oklch(0.52 0.14 155)`
- Radius: 12 / 18 / 28px
- Spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 72 / 96px

## Typography
Outfit for display and interface copy, with system sans fallbacks. Large headings use restrained tracking and balanced wrapping. Numeric values use tabular numerals.

## Components
Buttons have 48px minimum height, visible focus, stable hover states, and one primary action per region. Cards are used for independently actionable properties and records, never nested. The callback form is a centered popup on larger screens and a safe-area-aware bottom sheet on phones, with focus trapping, focus restoration, labelled fields, and inline submission feedback. WhatsApp uses conventional buttons throughout the product; only the selected-property mobile footer uses the physical left-to-right drag control, with keyboard operation and a direct-link fallback available in the property enquiry area. The automated support guide uses a recognizable chat launcher, agent identity, conversational message bubbles, quick replies, and a lower-right desktop popover/mobile bottom sheet.

## Motion
180–280ms ease-out transitions communicate hover, modal entry, tab changes, gesture completion, and support-panel entry. Reduced-motion disables transforms and nonessential animation.

## Accessibility
WCAG AA contrast, labelled fields, keyboard-operable controls, semantic records, aria-live feedback, non-color status labels, focus containment for modal UI, and responsive layouts down to 320px. Fixed mobile actions and sheets respect device safe-area insets.
