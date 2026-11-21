# ILY design

Source: `ILY — design.html` (design board: design system + 8 screens). Implemented in
[frontend/](frontend/); tokens live in [frontend/src/styles.css](frontend/src/styles.css).

## Look

The video and the hands are the point, so everything around them is quiet: white background,
lines instead of cards, one blue for actions, yellow only for the camera's "eyes".

| Token | Value | Use |
|---|---|---|
| Ink | `#0F1B4D` | Text and the video stage background |
| Cobalt | `#2348E8` (hover `#1A37BD`, bg `#E7ECFD`) | Primary action, links, current step |
| Sun | `#FFC845` | Only the logo and camera overlays: hand frame, points, path |
| Surface / line | `#F2F4F8` / `#DFE3EB` | Progress strip, dividers |
| Muted text | `#4A5578` | Secondary text (7.4:1) |
| Done | `#0B7048` / `#DCF1E6` | "Got it" |
| Fix | `#A84700` / `#FBE8D8`, text `#5C2700` | Coach hint, "fix this" |
| Not seen | `#C7CDDA`, text `#4A5578` | Camera was not sure |
| Stars | `#B98900` | Lesson-done stars |

- Fonts (Google Fonts): **Rubik** 700/800 for headings and letters, **Onest** 400–700 for UI.
- Spacing in multiples of 4. Radius 10 buttons, 12 primary button, 16 tiles, 20 video stage. No shadows.

## Principles

1. Camera state is always visible: one status line over the video (hand in frame, light).
2. The reference stays next to the attempt during the check.
3. An error is advice: every "fix" says what to do and shows "you / reference".
4. Teacher's words, no percentages. Not sure → say "Show it again", never "wrong".
5. One primary (blue) action per screen, bottom right.
6. Record only when the frame is ready: 3, 2, 1 countdown.

## Screen layout

Nav bar (Back on the left, ILY, "How checking works") → lesson progress strip (letters of the
name, current one outlined in cobalt, step label on the right) → content → action bar
(text button left or right, primary button on the right).

## Don't

- Badges or labels above headings; meta lines joined with "·".
- A card per block or cards in cards. Group with spacing and lines.
- Cream or dotted backgrounds, gradients, glass, shadows.
- "→" in button text, emoji instead of icons.
- Model confidence percentages; "wrong" when the model is unsure.
- Status by colour only: always icon + text.
- More than one blue button per screen; progress inside the nav bar.
- Text under 13px, click targets under 44px.

## Decisions taken in code

- Hash routes, one per screen: `#/lessons`, `#/name`, `#/watch`, `#/quiz`, `#/check`,
  `#/coach`, `#/done`, `#/paywall`.
- Lessons → "Continue" goes to the name screen (the design linked straight to Watch).
- The name typed on the name screen drives the letter tiles, progress strip and the Done title.
- Mobile: first pass only (16px gutter, smaller headings, stacked columns); the design is desktop.
