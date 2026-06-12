"use client";

interface ModeToggleProps {
  holdMode: boolean;
  onChange: (holdMode: boolean) => void;
  disabled?: boolean;
}

export function ModeToggle({ holdMode, onChange, disabled }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted">
      <span className={holdMode ? "font-semibold text-foreground" : ""}>
        Hold
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={!holdMode}
        aria-label="Toggle dictation mode"
        disabled={disabled}
        onClick={() => onChange(!holdMode)}
        className={`relative h-7 w-12 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft disabled:opacity-50 ${
          holdMode ? "bg-muted-light" : "bg-accent"
        }`}
      >
        <span
          className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
            holdMode ? "translate-x-0" : "translate-x-5"
          }`}
        />
      </button>
      <span className={!holdMode ? "font-semibold text-foreground" : ""}>
        Toggle
      </span>
    </div>
  );
}
