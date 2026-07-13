export function BackgroundTexture() {
  const waves = Array.from({ length: 9 });

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1600 1400"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 z-0 min-h-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wave-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--wave-line)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--wave-line)" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {waves.map((_, i) => {
        const yOff = i * 170 - 80;
        const amp = 46 + (i % 3) * 14;
        return (
          <path
            key={i}
            d={`M -100 ${yOff} C 250 ${yOff - amp}, 550 ${yOff + amp}, 850 ${yOff} S 1450 ${
              yOff - amp
            }, 1700 ${yOff}`}
            fill="none"
            stroke="url(#wave-fade)"
            strokeWidth="1.4"
          />
        );
      })}
      <circle cx="20%" cy="18%" r="260" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.5" />
      <circle cx="82%" cy="86%" r="300" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}
