import React from 'react';
import { cn } from '../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'low' | 'high' | 'lowest';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'lowest', ...props }, ref) => {
    const variants = {
      default: 'bg-surface',
      low: 'bg-surface-container-low',
      high: 'bg-surface-container-high',
      lowest: 'bg-surface-container-lowest apothecary-shadow',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-2xl p-6 transition-all', variants[variant], className)}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
