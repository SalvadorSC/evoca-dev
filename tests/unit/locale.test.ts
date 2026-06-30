import { describe, it, expect } from "vitest"
import { currencyForCountry } from "@/lib/locale"

describe("currencyForCountry", () => {
  it.each(["FR", "DE", "ES", "IT", "NL", "GB", "NO", "CH"])(
    "returns EUR for EU/EEA country %s",
    (country) => {
      expect(currencyForCountry(country)).toBe("EUR")
    },
  )

  it.each(["US", "CA", "BR", "JP", "AU", "IN"])(
    "returns USD for non-EU country %s",
    (country) => {
      expect(currencyForCountry(country)).toBe("USD")
    },
  )

  it("is case-insensitive", () => {
    expect(currencyForCountry("fr")).toBe("EUR")
    expect(currencyForCountry("us")).toBe("USD")
  })

  it("defaults to EUR when country is null or undefined", () => {
    expect(currencyForCountry(null)).toBe("EUR")
    expect(currencyForCountry(undefined)).toBe("EUR")
  })

  it("defaults to EUR for an empty string", () => {
    expect(currencyForCountry("")).toBe("EUR")
  })
})
