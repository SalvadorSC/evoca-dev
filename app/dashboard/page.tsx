import { redirect } from "next/navigation"

// The Talks list is the primary entry point. Any existing bookmarks to
// /dashboard are forwarded to it automatically.
export default function DashboardPage() {
  redirect("/dashboard/talks")
}
