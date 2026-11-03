import type { ReactNode } from 'react';

export const INPUT_CLASSES =
  'w-full rounded-xl border border-white/10 bg-graphite-850 px-4 py-2.5 text-sm text-graphite-100 placeholder:text-graphite-500 transition duration-200 focus:border-electric-500/60 focus:outline-none focus:ring-2 focus:ring-electric-500/20';

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-graphite-200">{label}</span>
      {children}
      {hint && <span className="block text-xs text-graphite-500">{hint}</span>}
    </label>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition duration-300 ${
        checked ? 'bg-electric-600' : 'bg-graphite-700'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow transition duration-300 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  );
}
