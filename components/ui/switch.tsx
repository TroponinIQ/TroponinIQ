'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';

type Variant = 'auto' | 'ios' | 'material';

interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  size?: 'sm' | 'md' | 'lg';
  variant?: Variant; // auto picks ios on iOS and material elsewhere
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, size = 'md', variant = 'auto', ...props }, ref) => {
  const isIOSPlatform =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  const resolved: Variant =
    variant === 'auto' ? (isIOSPlatform ? 'ios' : 'material') : variant;

  const presets = {
    ios: {
      sm: {
        track: 'h-5 w-10 rounded-[12px]',
        thumb: 'h-4 w-4 rounded-[10px]',
        translate: 'translate-x-5',
      },
      md: {
        track: 'h-6 w-11 rounded-[14px]',
        thumb: 'h-5 w-5 rounded-[12px]',
        translate: 'translate-x-6',
      },
      lg: {
        track: 'h-7 w-12 rounded-[16px]',
        thumb: 'h-6 w-6 rounded-[14px]',
        translate: 'translate-x-6',
      },
    },
    material: {
      sm: {
        track: 'h-5 w-9 rounded-full',
        thumb: 'h-3.5 w-3.5 rounded-full',
        translate: 'translate-x-4',
      },
      md: {
        track: 'h-6 w-10 rounded-full',
        thumb: 'h-4 w-4 rounded-full',
        translate: 'translate-x-5',
      },
      lg: {
        track: 'h-7 w-12 rounded-full',
        thumb: 'h-5 w-5 rounded-full',
        translate: 'translate-x-6',
      },
    },
  } as const;

  const dims = presets[resolved][size];

  return (
    <SwitchPrimitives.Root
      ref={ref}
      className={cn(
        'peer inline-flex shrink-0 cursor-pointer items-center transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-input hover:data-[state=unchecked]:bg-accent',
        dims.track,
        className,
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none block bg-background shadow-sm ring-0 transition-transform',
          dims.thumb,
          props.checked ? dims.translate : 'translate-x-0',
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
