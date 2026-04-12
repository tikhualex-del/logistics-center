export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—'
  // Return as-is for now; format based on locale/region in future iteration
  return phone
}
