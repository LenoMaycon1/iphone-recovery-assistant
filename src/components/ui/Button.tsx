import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-electric-600 text-white shadow-[0_8px_24px_-12px_rgba(31,111,255,0.9)] hover:bg-electric-500 active:bg-electric-700',
  secondary:
    'border border-white/10 bg-graphite-800 text-graphite-100 hover:border-electric-500/50 hover:bg-graphite-700',
  ghost: 'text-graphite-300 hover:bg-white/5 hover:text-white',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-graphite-800 ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
