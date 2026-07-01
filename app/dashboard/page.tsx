import { redirect } from "next/navigation"

// The primary entry point is now the conference dashboard.
// Any existing bookmarks to /dashboard are forwarded automatically.
export default function DashboardPage() {
  redirect("/dashboard/conference")
}
