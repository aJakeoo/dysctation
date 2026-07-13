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
      className={`relative flex h-36 w-36 select-none items-center justify-center rounded-full bg-mic shadow-[0_10px_32px_rgba(79,127,199,0.38)] transition-all duration-200 ease-out focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-soft disabled:opacity-50 sm:h-44 sm:w-44 ${
        active
          ? "scale-105 brightness-95"
          : "hover:brightness-105 active:scale-95"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-14 w-14 sm:h-16 sm:w-16"
      >
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="8" y1="22" x2="16" y2="22" />
      </svg>
    </button>
  );
}
