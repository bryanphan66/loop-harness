import * as React from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  htmlFor: string;
  error?: string;
}

/** Label + control + inline error — the skeleton's minimal form primitive. */
export function FormField({ label, htmlFor, error, className, children, ...props }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)} {...props}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
