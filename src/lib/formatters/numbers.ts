const LATIN_LOCALE = "ar-DZ-u-nu-latn";

export function toLatinDigits(value: string | number) {
  return String(value)
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

export function parseNumber(value: string | number, fallback = 0) {
  const parsed = Number(toLatinDigits(value).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat(LATIN_LOCALE).format(value);
}

export function formatCurrency(value: number) {
  return `${formatNumber(value)} د.ج`;
}

export function formatDate(value: Date | string | number | null | undefined) {
  if (value == null) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(LATIN_LOCALE).format(date);
}

export function formatTime(value: Date | string | number | null | undefined) {
  if (value == null) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(LATIN_LOCALE, { hour: "2-digit", minute: "2-digit" }).format(date);
}

export function formatPhone(value: string | number) {
  return toLatinDigits(value);
}
