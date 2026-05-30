/** Static, three.js-free stand-in for the live teaser (no-WebGL / reduced-motion / loading). */
export function MiniSimFallback() {
  return (
    <div data-testid="static-teaser" className="grid h-full w-full place-items-center bg-radial-plasma">
      <svg viewBox="0 0 100 100" className="h-2/3 w-2/3 opacity-80" aria-hidden="true" focusable="false">
        <circle cx="50" cy="50" r="10" fill="#fb923c" />
        <circle cx="50" cy="50" r="34" fill="none" stroke="#f472b6" strokeWidth="1" opacity="0.6" />
        <circle cx="84" cy="50" r="5" fill="#fbbf24" />
      </svg>
    </div>
  )
}
