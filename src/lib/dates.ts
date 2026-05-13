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
  // Build a local datetime string without timezone so Python receives a naive
  // datetime.datetime instead of an aware UTC value.
  if (!value) return ''

  const [datePart, timePart] = value.split('T')
  if (!datePart || !timePart) return ''

  const [year, month, day] = datePart.split('-').map((v) => Number(v))
  const [hour, minute] = timePart.split(':').map((v) => Number(v))

  const normalizedYear = String(year || 0).padStart(4, '0')
  const normalizedMonth = String(month || 1).padStart(2, '0')
  const normalizedDay = String(day || 1).padStart(2, '0')
  const normalizedHour = String(hour || 0).padStart(2, '0')
  const normalizedMinute = String(minute || 0).padStart(2, '0')

  return `${normalizedYear}-${normalizedMonth}-${normalizedDay}T${normalizedHour}:${normalizedMinute}:00`
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