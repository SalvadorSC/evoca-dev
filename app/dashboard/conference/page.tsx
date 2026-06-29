import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import {
  getUserConferences,
  getOrganizerSubscriptions,
} from "@/lib/db"
import { computeOrganizerAccess, hasOrganizerPrep, type OrganizerSubscription } from "@/lib/billing"
import Link from "next/link"
import { CalendarRange, Settings } from "lucide-react"
import { ConferenceListClient } from "@/components/conference/conference-list-client"

export default async function ConferenceListPage() {
  await requireAuth()
  const supabase = await createClient()

  const [conferences, subsRaw] = await Promise.all([
    getUserConferences(supabase),
    getOrganizerSubscriptions(supabase),
  ])

  const access = computeOrganizerAccess(subsRaw as unknown as OrganizerSubscription[])
  const canCreate = hasOrganizerPrep(access)

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
            Conferences
          </h1>
          <p className="font-mono text-xs text-jsconf-muted mt-1">
            Plan multi-day events, build the schedule, and assign speakers.
          </p>
        </div>
        <ConferenceListClient canCreate={canCreate} />
      </div>

      {conferences.length === 0 ? (
        <div className="border border-dashed border-jsconf-border bg-jsconf-surface p-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-jsconf-yellow-dim flex items-center justify-center mb-4">
            <CalendarRange className="h-5 w-5 text-jsconf-yellow" />
          </div>
          <h2 className="font-display font-bold text-lg text-white mb-2 uppercase tracking-wide">
            No conferences yet
          </h2>
          <p className="font-mono text-sm text-jsconf-muted mb-6 max-w-sm">
            Create a conference to start building its program across multiple days.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {conferences.map((conf) => (
            <div
              key={conf.id}
              className="bg-jsconf-surface border border-jsconf-border p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-white text-base truncate">{conf.name}</h3>
                <span className="font-mono text-xs text-jsconf-muted flex items-center gap-1.5 mt-1.5">
                  <CalendarRange className="h-3 w-3" />
                  Created{" "}
                  {new Date(conf.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <Link
                href={`/dashboard/conference/${conf.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-jsconf-yellow/90 transition-all duration-150 shrink-0"
              >
                <Settings className="h-3 w-3" />
                Manage
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
