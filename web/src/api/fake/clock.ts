/**
 * A controllable clock, used only by the fake source.
 *
 * It lives behind the seam on purpose. Features and shared components must
 * never import it — ESLint enforces that — because a real source will have no
 * clock to advance, and any component reaching for one would have to be
 * rewritten when the endpoints arrive.
 */
export class FakeClock {
  private current: Date;

  constructor(start: Date) {
    this.current = start;
  }

  now(): Date {
    return new Date(this.current.getTime());
  }

  advance(minutes: number): void {
    this.current = new Date(this.current.getTime() + minutes * 60_000);
  }
}
