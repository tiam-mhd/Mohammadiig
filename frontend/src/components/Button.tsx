/**
 * Button — soft Bugatti pill
 */

'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border-white/85 bg-transparent text-white hover:bg-white hover:text-black',
  secondary: 'border-[#999] bg-transparent text-white hover:border-white',
  outline: 'border-white/85 bg-transparent text-white hover:bg-white hover:text-black',
  ghost: 'border-transparent bg-transparent text-white hover:opacity-55',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-9 px-5 text-[10px]',
  sm: 'h-9 px-6 text-[10px]',
  md: 'h-10 px-7 text-[11px]',
  lg: 'h-10 px-7 text-[11px]',
  xl: 'h-11 px-8 text-xs',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, className, children, disabled, ...props }, ref) => {
    const classes = [
      'inline-flex items-center justify-center gap-2',
      'font-ui tracking-[0.02em]',
      'rounded-full border',
      'transition-[background-color,color,border-color,opacity] duration-450',
      'cursor-pointer',
      'disabled:cursor-not-allowed disabled:opacity-40',
      variantClasses[variant],
      sizeClasses[size],
      className || '',
    ].join(' ');

    return (
      <button ref={ref} className={classes} disabled={disabled || isLoading} {...props}>
        {isLoading ? (
          <>
            <span className="inline-block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
