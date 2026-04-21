'use client'

import { type TextareaHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label ? (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={id}
          rows={3}
          className={clsx(
            'block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
            className,
          )}
          {...props}
        />
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
