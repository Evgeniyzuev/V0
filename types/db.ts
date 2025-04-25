export interface User {
  id: string
  telegram_id: number
  telegram_username?: string | null
  first_name?: string | null
  last_name?: string | null
  reinvest: number
  aicore_balance: number
  wallet_balance: number
  level: number
  paid_referrals: number
  referrer_id?: number | null
} 