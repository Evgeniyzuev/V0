"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import TelegramConnectButton from "./telegram-connect-button"

const supabase = createClientSupabaseClient()

interface TelegramNotificationSettings {
  telegram_chat_id: number | null
  receive_interest_notifications: boolean
}

export default function TelegramNotificationSettings() {
  return null;
} 