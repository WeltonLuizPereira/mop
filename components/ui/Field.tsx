import React, { useId } from 'react';

export const ROTULO = 'block text-[13px] font-medium text-ink-2';

export interface FieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactElement;
}

type ControlProps = React.HTMLAttributes<HTMLElement> & {
  id?: string;
  required?: boolean;
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
};

export const Field = ({
  label,
  hint,
  error,
  required = false,
  className = '',
  children,
}: FieldProps) => {
  const generatedId = useId();
  const controlElement = children as React.ReactElement<ControlProps>;
  const controlProps = controlElement.props;
  const controlId = controlProps.id ?? generatedId;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const describedBy = [
    controlProps['aria-describedby'],
    hint ? hintId : undefined,
    error ? errorId : undefined,
  ].filter(Boolean).join(' ') || undefined;

  const control = React.cloneElement(controlElement, {
    id: controlId,
    required: required || controlProps.required,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : controlProps['aria-invalid'],
  });

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={controlId} className={ROTULO}>{label}</label>
      {control}
      {hint && <p id={hintId} className="text-xs text-ink-mute">{hint}</p>}
      {error && <p id={errorId} className="text-xs text-danger">{error}</p>}
    </div>
  );
};
