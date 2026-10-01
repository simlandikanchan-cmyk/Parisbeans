/*
 * Site intro configuration and timing.
 *
 * Lives apart from the component so the exit sequence reads as one ordered
 * list, and so nothing here is a magic number buried in an effect.
 */

/*
 * On by default. The intro is a brand moment, not a loading screen: once it
 * has played in a tab, refreshes and in-site navigation skip it. sessionStorage
 * is scoped to the tab, so closing the tab and coming back replays it, while
 * F5 does not. Set back to false to review the intro on every reload.
 */
export const PRELOADER_OPTIONS = {
  showOncePerSession: true,
}

const SESSION_KEY = 'parisbeans:preloader-played'

/*
 * A pure read. Writing the flag from here would be a side effect during
 * render, and StrictMode renders every component twice: the first pass would
 * set the key and the second would read it back, so the very first visit
 * would skip the intro it was supposed to play. The write lives in
 * markPlayed(), which only runs once the intro has genuinely started.
 */
export function alreadyPlayed() {
  if (!PRELOADER_OPTIONS.showOncePerSession) return false
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    /* Private mode or storage disabled: show the intro rather than skip it. */
    return false
  }
}

/* Called once the intro actually plays, so a visit that is skipped (or one
   that never gets to mount) does not consume the one allowed play. */
export function markPlayed() {
  if (!PRELOADER_OPTIONS.showOncePerSession) return
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    /* Nothing to do: without storage the intro simply plays again next load. */
  }
}

/*
 * Must match the end of the timeline authored in Preloader.css, where the
 * tagline is the last thing to land (--pb-tagline-delay + --pb-tagline-dur).
 *
 * The curtain will not start retracting before this point, because cutting the
 * draw short is exactly what turns a brand moment into a loading screen. It is
 * not a delay: whichever of readiness and this milestone lands second owns the
 * exit, so a page that is ready in 400ms is released as soon as the draw is
 * finished, not one millisecond later.
 */
export const BRAND_MOMENT_MS = 1560

/* The readout rides the same clock as the intro, so `min(READOUT_RAMP_MS,
   BRAND_MOMENT_MS)` is the floor. It is deliberately equal to the brand moment:
   a real page is ready long before the seal finishes inscribing, and a bar that
   sits at 000 for 300ms and then snaps to 100 is the exact artefact this
   component exists to avoid. Matching the two means the number is always
   chasing something the eye can see moving. It still can never outrun reality —
   see the `goal` clamp in Preloader.jsx. */
export const READOUT_RAMP_MS = BRAND_MOMENT_MS

/* Breath between 100% and the first pixel of the reveal. */
export const HOLD_MS = 150

/* Matches --pb-exit-dur. Also the safety net for transitionend, which never
   fires for a zero-duration reduced-motion transition. */
export const EXIT_MS = 860

/* Absolute ceiling. No combination of network or media failures can keep the
   curtain up past this point. */
export const LAST_RESORT_MS = 8000
