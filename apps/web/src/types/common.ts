export type ID = string

export interface Timestamps {
  createdAt: string
  updatedAt: string
}

export interface SelectOption<T = string> {
  label: string
  value: T
}
