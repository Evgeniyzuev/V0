"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function saveEntry(formData: FormData) {
  try {
    const text = formData.get("text")

    if (!text || typeof text !== "string" || text.trim() === "") {
      return { success: false, error: "Text is required" }
    }

    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from("entries").insert([{ text: text.trim() }])

    if (error) {
      console.error("Error saving entry:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error in saveEntry:", error)
    return { success: false, error: "Failed to save entry" }
  }
}

export async function getEntries() {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("entries").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching entries:", error)
      return { success: false, error: error.message, entries: [] }
    }

    return { success: true, entries: data }
  } catch (error) {
    console.error("Error in getEntries:", error)
    return { success: false, error: "Failed to fetch entries", entries: [] }
  }
}

