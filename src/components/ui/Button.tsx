'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-r from-pink-500 to-purple-600
    hover:from-pink-600 hover:to-purple-700
    text-white shadow-lg hover:shadow-xl
    hover:scale-105
  `,
  secondary: `
    bg-white/10 backdrop-blur-sm border border-white/20
    hover:bg-white/20 text-white
    hover:scale-105
  `,
  ghost: `
    bg-transparent hover:bg-white/10
    text-white/80 hover:text-white
  `,
  danger: `
    bg-gradient-to-r from-red-500 to-rose-600
    hover:from-red-600 hover:to-rose-700
    text-white shadow-lg hover:shadow-xl
    hover:scale-105
  `,
  success: `
    bg-gradient-to-r from-green-500 to-emerald-600
    hover:from-green-600 hover:to-emerald-700
    text-white shadow-lg hover:shadow-xl
    hover:scale-105
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs sm:text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base rounded-xl gap-2',
  lg: 'px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg rounded-2xl gap-3',
};

const baseStyles = `
  inline-flex items-center justify-center font-semibold
  transition-all duration-300 ease-out
  focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent
  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
`;

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

// Convenience components for common button types
export function PrimaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="primary" {...props} />;
}

export function SecondaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="secondary" {...props} />;
}

export function GhostButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="ghost" {...props} />;
}

export default Button;
