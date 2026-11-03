import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
}

export default function Card({ children, interactive = false, className = '', ...rest }: CardProps) {
  const interactiveClasses = interactive
    ? 'transition duration-300 hover:-translate-y-0.5 hover:border-electric-500/40 hover:shadow-glow'
    : '';

  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-graphite-900/80 p-6 shadow-card ${interactiveClasses} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
