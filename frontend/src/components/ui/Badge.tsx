import { ReactNode } from 'react';

export type BadgeTone = 'green' | 'blue' | 'amber' | 'red' | 'gray';

const toneClasses: Record<BadgeTone, string> = {
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-700',
};

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
}

/**
 * Атомарный бейдж — компактная метка статуса/категории.
 */
export function Badge({ children, tone = 'gray' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
      data-testid="badge"
    >
      {children}
    </span>
  );
}