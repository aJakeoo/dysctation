"use client";

interface MicButtonProps {
  active: boolean;
  disabled?: boolean;
  onPressStart: () => void;
  onPressEnd: () => void;
  onClick: () => void;
  holdMode: boolean;
}

export function MicButton({
  active,
  disabled,
  onPressStart,
  onPressEnd,
  onClick,
  holdMode,
}: MicButtonProps) {
  const handlers = holdMode
    ? {
        onMouseDown: onPressStart,
        onMouseUp: onPressEnd,
        onMouseLeave: onPressEnd,
        onTouchStart: (e: React.TouchEvent) => {
          e.preventDefault();
          onPressStart();
        },
        onTouchEnd: (e: React.TouchEvent) => {
          e.preventDefault();
          onPressEnd();
        },
      }
    : {
        onClick,
      };

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      aria-label={active ? "Stop recording" : "Start recording"}
      {...handlers}
      className={`relative flex h-28 w-28 select-none items-center justify-center rounded-full shadow-lg transition-all duration-300 ease-out focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-soft disabled:opacity-50 sm:h-32 sm:w-32 ${
        active
          ? "scale-105 bg-muted-light grayscale shadow-md"
          : "bg-accent hover:brightness-105 active:scale-95"
      }`}
    >
      {active && (
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-muted-light/60" />
      )}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-12 w-12 sm:h-14 sm:w-14"
      >
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="8" y1="22" x2="16" y2="22" />
      </svg>
    </button>
  );
}
