/**
 * Stylised VIRO wordmark.
 * "VIR" is rendered as text; the "O" is an inline SVG virus / corona icon.
 *
 * Pass `variant="light"` on dark backgrounds (white text),
 * or `variant="dark"` (default) on light backgrounds (navy text).
 */
export function ViroLogo({
  className = "",
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const textColor =
    variant === "light" ? "text-white" : "text-[hsl(218,50%,16%)]";
  const outerFill =
    variant === "light" ? "hsl(0,0%,100%)" : "hsl(218,50%,16%)";
  const spikeFill = outerFill;

  return (
    <span
      className={`inline-flex items-baseline select-none ${className}`}
      aria-label="VIRO"
    >
      {/* VIR text */}
      <span className={`font-extrabold tracking-tight ${textColor}`}>vir</span>

      {/* O — virus icon */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="inline-block"
        style={{
          height: "0.85em",
          width: "0.85em",
          marginLeft: "-0.02em",
          verticalAlign: "baseline",
          transform: "translateY(0.04em)",
        }}
        role="img"
        aria-hidden
      >
        {/* Spikes — 12 evenly spaced */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 50 + 32 * Math.cos(angle);
          const y1 = 50 + 32 * Math.sin(angle);
          const x2 = 50 + 44 * Math.cos(angle);
          const y2 = 50 + 44 * Math.sin(angle);
          const cx = 50 + 47 * Math.cos(angle);
          const cy = 50 + 47 * Math.sin(angle);
          return (
            <g key={i}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={spikeFill}
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx={cx} cy={cy} r="4" fill={spikeFill} />
            </g>
          );
        })}
        {/* Outer circle */}
        <circle cx="50" cy="50" r="30" fill={outerFill} />
        {/* Middle ring */}
        <circle cx="50" cy="50" r="20" fill="hsl(195,65%,45%)" />
        {/* Inner ring */}
        <circle cx="50" cy="50" r="11" fill="hsl(195,80%,60%)" />
        {/* Centre dot */}
        <circle cx="50" cy="50" r="5" fill="hsl(195,90%,75%)" />
      </svg>
    </span>
  );
}
