'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      checked,
      onCheckedChange,
      disabled = false,
      loading = false,
      size = 'md',
      className,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const sizeClasses = {
      sm: {
        button: 'h-4 w-7',
        thumb: 'h-3 w-3',
        translate: 'translate-x-3',
        loader: 'h-2 w-2',
      },
      md: {
        button: 'h-5 w-9',
        thumb: 'h-4 w-4',
        translate: 'translate-x-4',
        loader: 'h-2.5 w-2.5',
      },
      lg: {
        button: 'h-6 w-11',
        thumb: 'h-5 w-5',
        translate: 'translate-x-5',
        loader: 'h-3 w-3',
      },
    };

    const sizes = sizeClasses[size];
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        disabled={isDisabled}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'p-0.5',
          sizes.button,
          checked ? 'bg-primary' : 'bg-border hover:bg-muted',
          isDisabled && 'hover:bg-border',
          className,
        )}
        onClick={() => !isDisabled && onCheckedChange(!checked)}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block transform rounded-full bg-background shadow-sm transition duration-200 ease-in-out',
            'flex items-center justify-center',
            sizes.thumb,
            checked ? sizes.translate : 'translate-x-0',
          )}
        >
          {loading && (
            <Loader2
              className={cn('animate-spin text-muted-foreground', sizes.loader)}
            />
          )}
        </span>
      </button>
    );
  },
);

Toggle.displayName = 'Toggle';

export { Toggle };
