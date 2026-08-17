import React from 'react';
import { Button, type ButtonSize, type ButtonVariant } from './Button';

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  label: string;
  icon: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const ICON_SIZES: Record<ButtonSize, string> = {
  sm: 'min-w-8',
  md: 'min-w-9',
  touch: 'min-w-11',
};

export const IconButton = ({
  label,
  icon,
  size = 'md',
  className = '',
  ...props
}: IconButtonProps) => (
  <Button
    {...props}
    size={size}
    aria-label={label}
    className={`${ICON_SIZES[size]} px-0 ${className}`}
  >
    <span aria-hidden="true">{icon}</span>
  </Button>
);
