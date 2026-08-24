# Mobile Safari & Real Device Viewport Integrity Rules

To ensure 100% pixel-perfect responsiveness on physical iPhones, iPads, and Android devices (preventing right-edge cropping and horizontal overflow), every feature and UI change in this project MUST adhere to these mandatory rules:

## 1. Meta Viewport Standard
Every HTML entrypoint must include safe-area viewport configuration:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

## 2. Global Zero-Overflow & Text Size Adjust Guard
In `css/styles.css`:
- `html` must have `-webkit-text-size-adjust: 100%; text-size-adjust: 100%; overflow-x: hidden; width: 100%; box-sizing: border-box;`
- `*, *::before, *::after` must have `box-sizing: border-box; max-width: 100%;`
- `body` must have `overflow-x: hidden; width: 100%; max-width: 100vw;`
- `body` padding must use safe-area insets: `padding: 10px max(10px, env(safe-area-inset-right)) 16px max(10px, env(safe-area-inset-left));`

## 3. Flex Child Containment (`min-width: 0`)
- Any flex child containing text (like `h1`, `h2`, `.title`, `.stat-value`) MUST have `min-width: 0` and `flex: 1 1 auto` to allow proper flex shrinking. Otherwise, WebKit expands the flex row beyond screen boundaries.
- Badges and action buttons on the same row must have `flex-shrink: 0; white-space: nowrap;`.

## 4. Typography Fluid Clamping
- Major heading text must use `font-size: clamp(min, vw, max)` (e.g. `clamp(1.1rem, 3.8vw, 1.5rem)`) rather than rigid large fixed rems so it gracefully scales down on 320px–390px screens.

## 5. Pre-Push Mobile Verification Checklist
Before pushing any UI commit to `main`:
1. Verify `html, body, .container` have no horizontal scroll bar.
2. Verify all title headers and badges fit within 320px viewport without truncation.
3. Synchronize `src/main/resources/static/` with root files.
4. Increment CalVer patch (`v=3.MM.PP`) in `index.html` and assets.
