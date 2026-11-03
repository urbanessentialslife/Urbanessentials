/** Sitewide, near-invisible grain texture — see `.grain-overlay` in
 * app.css for why this exists instead of an image asset. */
export function FilmGrain() {
  return <div aria-hidden="true" className="grain-overlay" />;
}
