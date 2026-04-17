import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from("pro_waitlist")
      .insert({ email: email.trim().toLowerCase() })

    if (error) {
      // 23505 = unique_violation (already on the list)
      if (error.code === "23505") {
        return NextResponse.json({ error: "This email is already on the waitlist." }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
