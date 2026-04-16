"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function deleteTalk(talkId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // RLS ensures you can only delete your own talks.
  // Sessions will cascade-delete via the FK constraint.
  const { error } = await supabase
    .from("talks")
    .delete()
    .eq("id", talkId)

  if (error) throw new Error(error.message)

  revalidatePath("/dashboard")
}
