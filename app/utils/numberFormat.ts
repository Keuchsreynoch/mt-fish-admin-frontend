export type NumericValue = string | number | null | undefined

interface FormatDecimalOptions {
  locale?: string
  maximumFractionDigits?: number
  minimumFractionDigits?: number
  fallback?: string
}

export function parseDecimal(value: NumericValue): number {
  if (value === null || value === undefined || value === '') return 0
  return Number.parseFloat(String(value).replace(/,/g, '')) || 0
}

export function formatDecimal(
  value: NumericValue,
  {
    locale = 'en-US',
    maximumFractionDigits = 2,
    minimumFractionDigits = 0,
    fallback = '0',
  }: FormatDecimalOptions = {},
): string {
  if (value === null || value === undefined || value === '') return fallback

  const numericValue = typeof value === 'number' ? value : Number.parseFloat(String(value).replace(/,/g, ''))

  if (Number.isNaN(numericValue)) return fallback

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericValue)
}

export function trimTrailingZeros(
  value: NumericValue,
  {
    locale = 'en-US',
    maximumFractionDigits = 20,
    minimumFractionDigits = 0,
    fallback = '',
  }: FormatDecimalOptions = {},
): string {
  return formatDecimal(value, {
    locale,
    maximumFractionDigits,
    minimumFractionDigits,
    fallback,
  })
}
