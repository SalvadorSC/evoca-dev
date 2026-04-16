"use server"

import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function deleteTalk(talkId: string) {
  await requireAuth()
  const supabase = await createClient()

  // RLS ensures you can only delete your own talks.
  // Sessions will cascade-delete via the FK constraint.
  const { error } = await supabase
    .from("talks")
    .delete()
    .eq("id", talkId)

  if (error) throw new Error(error.message)

  revalidatePath("/dashboard")
}
