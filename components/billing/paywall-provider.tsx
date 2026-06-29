"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import useSWR from "swr"
import type { Currency, PlanId } from "@/lib/plans"
import type { OrganizerAccess, OrganizerAccessLevel } from "@/lib/billing"
import { PaywallModal } from "./paywall-modal"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export interface PriceInfo {
  amount: number
  displayMonthly: number | null
}

interface AccessResponse {
  authenticated: boolean
  access: OrganizerAccess
}

interface LocaleResponse {
  currency: Currency
  country: string | null
  prices: Record<PlanId, PriceInfo>
}

type GateLevel = Exclude<OrganizerAccessLevel, "none">

interface PaywallContextValue {
  access: OrganizerAccess
  isLoading: boolean
  currency: Currency
  prices: Record<PlanId, PriceInfo> | null
  /** Opens the upgrade modal with an optional explanation. */
  openPaywall: (reason?: string) => void
  /** Runs `action` if the user meets `required` access, else opens the paywall. */
  checkGate: (required: GateLevel, action: () => void) => void
  /** True if the user currently meets the given access level. */
  hasAccess: (required: GateLevel) => boolean
  refresh: () => void
}

const NONE_ACCESS: OrganizerAccess = {
  level: "none",
  plan: null,
  subscriptionId: null,
  expiresAt: null,
  eventStart: null,
  eventEnd: null,
}

const PaywallContext = createContext<PaywallContextValue | null>(null)

const RANK: Record<OrganizerAccessLevel, number> = { none: 0, prep: 1, live: 2 }

export function PaywallProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string | undefined>(undefined)
  const pendingAction = useRef<(() => void) | null>(null)

  const { data: accessData, mutate: mutateAccess, isLoading: accessLoading } =
    useSWR<AccessResponse>("/api/billing/access", fetcher)
  const { data: localeData } = useSWR<LocaleResponse>("/api/locale", fetcher, {
    revalidateOnFocus: false,
  })

  const access = accessData?.access ?? NONE_ACCESS
  const currency = localeData?.currency ?? "EUR"
  const prices = localeData?.prices ?? null

  const hasAccess = useCallback(
    (required: GateLevel) => RANK[access.level] >= RANK[required],
    [access.level],
  )

  const openPaywall = useCallback((why?: string) => {
    setReason(why)
    setOpen(true)
  }, [])

  const checkGate = useCallback(
    (required: GateLevel, action: () => void) => {
      if (RANK[access.level] >= RANK[required]) {
        action()
        return
      }
      pendingAction.current = action
      setReason(
        required === "live"
          ? "This action needs an active event. Upgrade or activate your event window to continue."
          : "This is an organizer feature. Choose a plan to continue.",
      )
      setOpen(true)
    },
    [access.level],
  )

  const refresh = useCallback(() => {
    void mutateAccess()
  }, [mutateAccess])

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next)
    if (!next) pendingAction.current = null
  }, [])

  const value = useMemo<PaywallContextValue>(
    () => ({
      access,
      isLoading: accessLoading,
      currency,
      prices,
      openPaywall,
      checkGate,
      hasAccess,
      refresh,
    }),
    [access, accessLoading, currency, prices, openPaywall, checkGate, hasAccess, refresh],
  )

  return (
    <PaywallContext.Provider value={value}>
      {children}
      <PaywallModal
        open={open}
        onOpenChange={handleOpenChange}
        reason={reason}
        currency={currency}
        prices={prices}
        currentAccess={access}
      />
    </PaywallContext.Provider>
  )
}

export function usePaywall(): PaywallContextValue {
  const ctx = useContext(PaywallContext)
  if (!ctx) throw new Error("usePaywall must be used within a PaywallProvider")
  return ctx
}
