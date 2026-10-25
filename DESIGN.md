# DESIGN.md — Quiet Utility

## 1) Visual Foundations

### Theme & Tokens

- **Base theme:** Preserve the existing shadcn/ui light theme. Dark mode tokens exist in `src/index.css` but are out of scope for this deliverable.
- **Source of truth:** `src/index.css` defines semantic CSS variables under `:root` (background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, sidebar/_, chart/_). Tailwind v4 maps them via `@theme inline`.
- **Typography:** `Geist Variable` (`@fontsource-variable/geist`) set as `--font-sans`. Use `font-sans` with a restrained type scale (see Type Scale). Headings can use `font-heading` (mapped to `var(--font-sans)`).
- **Color usage:** Use semantic tokens only. Color is reserved for interactive states, statuses, and meaningful feedback. Do **not** introduce a new brand palette.
- **Radii:** `--radius: 0.625rem`. Scale via `--radius-sm/md/lg/xl/2xl/3xl/4xl` (derived). Use moderate, consistent radii from the theme.
- **Borders/Shadows/Surfaces:** Thin borders (`border` token), restrained surfaces (`card`, `muted`, `background`), subtle separators, minimal shadows. Avoid gradients, glassmorphism.
- **Icons:** Lucide React. Use sparingly and consistently.

### Type Scale (restrained)

| Element        | Classes (suggested)                  | Notes              |
| -------------- | ------------------------------------ | ------------------ |
| Page title     | `text-lg font-medium tracking-tight` | One per page       |
| Section header | `text-sm font-medium`                | Clear hierarchy    |
| Body           | `text-sm`                            | Default UI text    |
| Table cell     | `text-sm`                            | Dense but readable |
| Meta/labels    | `text-xs text-muted-foreground`      | Secondary info     |
| Badges/status  | `text-xs`                            | Compact            |

### Spacing

Use a tight, predictable scale (Tailwind defaults). Prefer gaps of `gap-2`/`gap-3`/`gap-4` and padding `px-3 py-2` for compact controls. Avoid excessive whitespace and oversized metric cards.

## 2) Component Conventions

### Available Primitives

- Currently present: `src/components/ui/button.tsx` (Base UI + CVA).
- Preferred set (compose as needed): `Button`, `Input`, `Label`, `Select`, `Table`, `Card`, `Badge`, `Tabs`, `Dialog`, `Sheet`, `AlertDialog`, `DropdownMenu`, `RadioGroup`, `Separator`, `Skeleton`, `Toast`/project notification component.

### Button Hierarchy

| Variant       | Use                                   | Notes                                                    |
| ------------- | ------------------------------------- | -------------------------------------------------------- |
| `default`     | Primary action (one per page/surface) | High emphasis, uses `primary`                            |
| `outline`     | Secondary actions                     | Subtle border, `background`/`muted` on hover             |
| `secondary`   | Tertiary/alternative actions          | Lower emphasis                                           |
| `ghost`       | Icon/utility actions in dense UIs     | Minimal chrome                                           |
| `destructive` | Destructive/irreversible actions      | Uses `destructive` tokens; must be clearly distinguished |
| `link`        | Inline navigation-like actions        | Use sparingly                                            |

### Composition Rules

- **Compose, don't restyle ad hoc:** Build reusable domain components (e.g. `DataTable`, `PageHeader`, `FilterBar`) from shadcn/ui primitives + semantic tokens.
- **Focus states:** Always preserve visible focus (`focus-visible:ring-3`, `focus-visible:border-ring`) as implemented in Button.
- **Disabled:** Use native `disabled` with existing disabled styles (opacity/`pointer-events-none`).
- **Icons:** Size to match text (`[&_svg:not([class*='size-'])]:size-4` pattern). Keep decorative icons minimal.

### Motion/Micro-interactions (Emil Kowalski)

Apply the `emil-design-eng` principles:

- **No animation by default.** Only animate if it clearly improves clarity or feedback.
- **Frequency matters:** Avoid animating frequent actions (keyboard shortcuts, repeated toggles).
- **Purpose required:** Valid reasons only (spatial consistency, state indication, feedback, preventing jarring changes).
- **Easing:** Prefer `ease-out` for entrances/feedback; custom curves if needed. Never use `ease-in` for UI. Keep durations < 300ms (100-200ms typical for feedback/popovers).
- **Feedback:** Subtle press feedback only when it aids recognition (e.g. button active state). No decorative transitions.
- **Perceived performance:** Speed > flourish.

## 3) Page Layouts

### Application Shell (for management pages)

Use a consistent shell when applicable:

- **Sidebar:** Navigation for core areas (Inventory, Sales/POS, Purchases, Reports, Settings). Use `sidebar` tokens. Keep compact.
- **Header:** Compact app header (store/context, user/menu). Minimal height.
- **Main:** Clearly structured content area with max-width as needed for tables/forms.
- **Footer:** Omit unless operationally necessary.

### Page Structure

Every management page must have:

1. **Page header:** Clear title (e.g. "Products") and **one primary action** (e.g. "Add product").
2. **Controls:** Search and filters immediately above the records they control (`FilterBar`).
3. **Content:** Prefer `Table` for inventory/transactional records. Use `Card` only for meaningful grouping (forms, summaries that need framing). Avoid oversized metric cards.
4. **States:** Account for loading, empty, error, success, disabled as relevant.

### Layout Guidance

- **Desktop:** Efficient, scannable tables. Don't make text/controls uncomfortably small.
- **Tablet:** Collapse filters into a sheet/dropdown if space tight; keep table horizontally scrollable only if necessary, prefer reflowing.
- **Mobile:** Stack header/actions, move filters to a sheet, allow horizontal scroll for wide tables with care, ensure tap targets >= comfortable size.
- **Hierarchy:** Primary action stands apart from secondary actions. Destructive actions separated/explicit.

## 4) Interaction States

| State          | Treatment                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Default        | Use semantic tokens, no decoration                                                                     |
| Hover          | Subtle token change (e.g. `hover:bg-muted`) per component conventions                                  |
| Focus          | Visible focus ring using `ring`/`focus-visible:ring-3`                                                 |
| Active/Pressed | Minimal feedback only if it aids clarity (respect motion rules)                                        |
| Disabled       | Reduced opacity, non-interactive                                                                       |
| Loading        | Use `Skeleton` for content regions; disable actions; show non-blocking indicators                      |
| Empty          | Concise message + optional primary action (e.g. "No products yet. Add product.")                       |
| Error          | Clear message with actionable guidance; don't blame user; avoid modals for inline errors when possible |
| Success        | Transient, explicit feedback (via toast/notification component if present)                             |
| Validation     | Explicit labels, understandable messages near fields                                                   |

## 5) Responsive Rules

- **Mobile-first:** Adapt deliberately.
- **Tables:** For wide tables on small screens, allow controlled horizontal scrolling or prioritize columns; keep headers visible.
- **Actions:** Stack or collapse into menus; keep primary action accessible.
- **Forms:** Single column on narrow screens.
- **Touch targets:** Sufficient size, adequate spacing.
- **No layout shift:** Avoid decorative elements that reflow unpredictably.

## Notes

- **No backend assumptions:** Don't invent endpoints/integrations. Example data only.
- **Payments:** If recording payment method/account, never imply provider-confirmed success unless explicitly stated by actual confirmation; use neutral phrasing like "Recorded payment method: ..."
- **Consistency:** Reuse typography, spacing, variants, table patterns, button hierarchy, status treatments, navigation across all screens.
