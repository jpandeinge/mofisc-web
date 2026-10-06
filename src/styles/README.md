# Styling conventions

Mofisc keeps shared colour values in two coordinated files:

- `colors.ts` exposes typed values to React and TypeScript code.
- `themes.css` exposes semantic CSS custom properties.

Use semantic names such as `text.primary`, `background.secondary`, or
`--color-status-error`. Avoid introducing a raw colour in a component when an
existing semantic token expresses the same role.

## React and TypeScript

```tsx
import { colors } from './styles/colors';

<p style={{ color: colors.text.primary }}>Account summary</p>
```

Use `withOpacity()` when a token needs transparency.

## CSS

```css
.summary-card {
  color: var(--color-text-primary);
  background: var(--color-bg-secondary);
  border-color: var(--color-border-light);
}
```

## Changing the palette

Update the matching semantic value in both `colors.ts` and `themes.css`, then
check affected screens in light and dark contexts. Verify contrast with an
accessibility tool; do not assume that a new combination meets WCAG merely
because the individual colours already exist in the palette.
