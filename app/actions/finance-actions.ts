"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// Функция для получения балансов пользователя
// Если указан userId, используем его, иначе получаем первого пользователя
export async function getUserBalances(userId?: string) {
  try {
    const supabase = createServerSupabaseClient()

    let query = supabase.from("users").select("id, wallet_balance, aicore_balance")

    // Если указан userId, используем его для фильтрации
    if (userId) {
      query = query.eq("id", userId)
    }

    const { data, error } = await query.limit(1).single()

    if (error) {
      console.error("Error fetching user balances:", error)
      return { success: false, error: error.message, walletBalance: 0, coreBalance: 0, userId: null }
    }

    return {
      success: true,
      walletBalance: Number.parseFloat(data.wallet_balance),
      coreBalance: Number.parseFloat(data.aicore_balance),
      userId: data.id,
    }
  } catch (error) {
    console.error("Error in getUserBalances:", error)
    return { success: false, error: "Failed to fetch user balances", walletBalance: 0, coreBalance: 0, userId: null }
  }
}

export async function topUpWalletBalance(amount: number, userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" }
    }

    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than zero" }
    }

    const supabase = createServerSupabaseClient()

    // Get current balance
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .single()

    if (fetchError) {
      console.error("Error fetching user balance:", fetchError)
      return { success: false, error: fetchError.message }
    }

    const currentBalance = Number.parseFloat(userData.wallet_balance)
    const newBalance = currentBalance + amount

    // Update balance
    const { error: updateError } = await supabase.from("users").update({ wallet_balance: newBalance }).eq("id", userId)

    if (updateError) {
      console.error("Error updating wallet balance:", updateError)
      return { success: false, error: updateError.message }
    }

    revalidatePath("/")
    return { success: true, newBalance }
  } catch (error) {
    console.error("Error in topUpWalletBalance:", error)
    return { success: false, error: "Failed to top up wallet balance" }
  }
}

export async function transferToCore(amount: number, userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" }
    }

    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than zero" }
    }

    const supabase = createServerSupabaseClient()

    // Get current balances
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("wallet_balance, aicore_balance")
      .eq("id", userId)
      .single()

    if (fetchError) {
      console.error("Error fetching user balances:", fetchError)
      return { success: false, error: fetchError.message }
    }

    const walletBalance = Number.parseFloat(userData.wallet_balance)
    const coreBalance = Number.parseFloat(userData.aicore_balance)

    // Check if wallet has enough funds
    if (walletBalance < amount) {
      return { success: false, error: "Insufficient funds in wallet" }
    }

    const newWalletBalance = walletBalance - amount
    const newCoreBalance = coreBalance + amount

    // Update balances
    const { error: updateError } = await supabase
      .from("users")
      .update({
        wallet_balance: newWalletBalance,
        aicore_balance: newCoreBalance,
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating balances:", updateError)
      return { success: false, error: updateError.message }
    }

    // Log the operation
    const { error: logError } = await supabase.rpc('log_core_operation', {
      p_user_id: userId,
      p_amount: amount,
      p_type: 'transfer'
    })

    if (logError) {
      console.error("Error logging operation:", logError)
      // Don't fail the transfer if logging fails
    }

    revalidatePath("/")
    return {
      success: true,
      newWalletBalance,
      newCoreBalance,
    }
  } catch (error) {
    console.error("Error in transferToCore:", error)
    return { success: false, error: "Failed to transfer to core" }
  }
}

export async function updateUserReinvest(userId: string, reinvestPercentage: number) {
  try {
    if (reinvestPercentage < 50 || reinvestPercentage > 100) {
      throw new Error('Reinvest percentage must be between 50 and 100')
    }

    const supabase = createServerSupabaseClient()
    const { error } = await supabase
      .from('users')
      .update({ reinvest: reinvestPercentage })
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/finance')
    return { success: true }
  } catch (error) {
    console.error('Error updating reinvest percentage:', error)
    throw error
  }
}

