# CLAUDE.md reference — detail moved from CLAUDE.md on 2026-10-14

These sections were moved verbatim from `CLAUDE.md` to keep it under 5 KB. CLAUDE.md points here; rules below still apply.

## Design Language

WSC Floor. The full rules are in `design-system/README.md`; this is the enforceable summary.

- **Two themes, shipped together.** Showroom is white with a deep velvet accent, Afterhours is
  near-black with gold. The accent flips with the theme, so components reference `--accent`,
  `--accent-ink` and `--on-accent`, never a literal purple or gold. `--velvet` and `--gold` are
  the two fixed marks: the Western affiliation lockup and sponsor tiers.
- **There are no borders.** Things are divided by a change in surface tone, by the gap between
  them, and by shadow. The focus ring is the only outline and is never removed.
- **Four type roles, nothing between them.** Title, subtitle, body, label. Every title is
  Archivo, all caps. A page of medium-sized headings is the failure mode this system prevents.
- **Slabs are the divider.** A page is a stack of slabs on `--page`, inset by the page gutter,
  separated by 24px of visible page ground. Adjacent slabs never share a tone, one loud slab
  per page, and the hero plus at least one section per page sit bare.
- **Motion arrives and stops.** Twelve named sequences, no thirteenth. Everything uses
  `--e-enter` unless it is leaving. Nothing floats, bounces or loops except the marquee.
- **Legible at rest.** Nothing is parked at `opacity: 0` waiting on an observer.

| Role | Face | Job |
| ---- | ---- | --- |
| `--f-display` | Archivo 800 to 900 | Every title, always uppercase |
| `--f-text` | Instrument Sans | Running copy and UI labels |
| `--f-data` | Geist Mono | Dates, counts, field labels, eyebrows |

---
