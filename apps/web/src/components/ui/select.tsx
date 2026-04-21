'use client'

import { type SelectHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, placeholder, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label ? (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        ) : null}
        <select
          ref={ref}
          id={id}
          className={clsx(
            'block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
            className,
          )}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    )
  },
)

Select.displayName = 'Select'
