export function toDatetimeLocal(value?: string | null) {
  if (!value) {
    return ''
  }
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function fromDatetimeLocal(value: string) {
  // `value` comes from an <input type="datetime-local" /> and has no timezone.
  // Parse its components explicitly to avoid cross-browser Date parsing issues
  // and produce an ISO string in UTC (Z) for server storage.
  if (!value) return ''

  const [datePart, timePart] = value.split('T')
  if (!datePart || !timePart) return ''

  const [year, month, day] = datePart.split('-').map((v) => Number(v))
  const [hour, minute] = timePart.split(':').map((v) => Number(v))

  const dt = new Date(year, (month || 1) - 1, day || 1, hour || 0, minute || 0)
  return dt.toISOString()
}

export function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}