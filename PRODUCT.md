# Product

## Register

product

## Users

A connoisseur on the couch, torch in hand. The coffee table is set: rig, banger, dab tool, a cap, the concentrate. They've already torched the banger or are about to. Lighting is dim, the room is warm, music is on. They want the next 90 seconds to be smooth and identical to the last hundred sessions — no fumbling, no mental math about cooldown curves, no second-guessing whether they're in the window. They're not learning thermodynamics; they're executing a ritual they've already decided on.

## Product Purpose

Quartzie hits the perfect dab window every session without making the user think about thermodynamics. The Dab Rite measures the surface temp; Quartzie reads it, models the cooling curve for the specific banger and concentrate in front of the user, and tells them precisely when to dab. Beyond the moment of truth, the app remembers: what banger, what concentrate, what wall thickness, what worked. Each session compounds into a tighter, more personal model of their setup.

Success looks like: the user opens the app, the orb tells them the device's state, a single number confirms the moment, the dab lands. Nothing else competed for attention.

## Brand Personality

Three words: **instrument-grade, ritualistic, restrained**.

- **Instrument-grade.** The numbers and curves are real physics. Type is precise, telemetry is monospaced, temperature units are deliberate. Nothing decorative pretends to be data.
- **Ritualistic.** The interface respects the 30-second calm before the dab. No notifications competing for the moment, no celebratory confetti, no gamification. The orb pulses, the temperature falls, the user breathes.
- **Restrained.** The orb is the only thing allowed to be loud. Everything else gets out of its way — flat surfaces, narrow type, breathing room. The drama is earned, not sprinkled.

Aligned references: Teenage Engineering OP-1 UI, Nothing OS clock, Apple Watch fitness ring climaxes, Hermès Apollo watch face, certain Phantom Liberty in-game UIs.

## Anti-references

Things this should never feel like:

- **Stoner-bro cannabis app.** No cannabis leaves, smoke trails, "420" anywhere, kush-purple gradients, hippie psychedelia, weed-pun copy. The user is here for precision; the substance is incidental.
- **Generic IoT companion dashboard.** Mi Home / SmartThings / Govee patterns — gridded device cards, settings pages that look like Android Auto. The orb is not a "device card."
- **Apple Health-style stat-spam.** Hero metrics, stacked rings, ribboned achievements. We are not the Health app for dabs.
- **SaaS B2B chrome.** Sidebars, breadcrumbs, dense settings tables, "configure your workspace." Quartzie is intimate, not enterprise.
- **Maximalist RGB / cyberpunk.** Glowing neon edges on everything, scanlines, animated gradient backgrounds. The aesthetic is theatrical glass + ember, not gamer setup.
- **Wellness-app softness.** Pastel pinks, rounded mascots, "you're doing great" reassurance copy. Quartzie respects the user's expertise; it doesn't coach.

## Design Principles

1. **Companion, not replacement.** The Dab Rite is the instrument; Quartzie is the readout, the timer, and the memory. The app never pretends to be the source of truth — it amplifies what the device says, and remembers what the user did with it. Every screen earns its place against this rule.

2. **The orb is the protagonist.** One element on every screen is allowed to be loud, and it's the orb. Color, motion, glow, scale — all reserved for it. Everything else recedes. Two protagonists is one too many.

3. **Ritual over readout.** A session has a tempo. The interface respects it: no abrupt transitions during a window, no notifications stealing focus, no unnecessary state changes. If something can wait until after the dab, it waits.

4. **Instrument-grade fidelity, no theater in the data.** Numbers are the truth — exact temp, exact seconds, exact unit. Animations may be theatrical; data never is. No fake precision, no rounded-up countdowns, no "approximately."

5. **One thing at a time.** During the 90 seconds that matter, the screen serves the current moment — pre-torch, heating, in-window, post-dab. Modes are mutually exclusive. The user shouldn't need to read to know which moment they're in.

## Accessibility & Inclusion

No specific WCAG target stated. Sensible defaults: legible contrast on the warm-on-dark palette (already strong: `on-surface` `#f6ded2` on `surface-container-lowest` `#160c06` clears WCAG AA for body text), respect `prefers-reduced-motion` for the orb pulse and ambient blooms, support Dynamic Type / system font sizing where it doesn't break the dial geometry. Color is never the sole signal for window state — the orb's hue carries it, but text and motion redundantly encode the same moment.
