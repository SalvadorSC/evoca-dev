import type { Currency } from "./plans"

// EU/EEA country codes => EUR. Everyone else => USD.
const EUR_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES",
  "SE", "IS", "LI", "NO", "CH", "GB", "MC", "SM", "AD", "VA",
])

export function currencyForCountry(country: string | null | undefined): Currency {
  if (!country) return "EUR" // default to EUR when unknown
  return EUR_COUNTRIES.has(country.toUpperCase()) ? "EUR" : "USD"
}
