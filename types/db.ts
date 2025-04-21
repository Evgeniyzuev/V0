export type DbUser = {
  id: string
  telegram_id?: number
  referrer_id?: number | null
  username?: string | null
  first_name?: string | null
  last_name?: string | null
  reinvest_setup: number
  aicore_balance: number
  wallet_balance: number
  level: number
  created_at: string
  last_login_date: string
  paid_referrals: number
} 