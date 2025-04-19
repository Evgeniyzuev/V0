"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

// Безопасные серверные функции для работы с балансом и уровнями
export async function getUserBalances(userId?: string) {
  try {
    const supabase = createServerSupabaseClient()

    let query = supabase
      .from("users")
      .select(`
        id, 
        wallet_balance, 
        aicore_balance,
        level,
        level_progress:aicore_balance
      `)

    if (userId) {
      query = query.eq("id", userId)
    }

    const { data, error } = await query.limit(1).single()

    if (error) {
      console.error("Error fetching user balances:", error)
      return { 
        success: false, 
        error: error.message, 
        walletBalance: 0, 
        coreBalance: 0, 
        level: 0,
        userId: null 
      }
    }

    // Получаем требования для следующего уровня
    const { data: nextLevelData } = await supabase
      .from('level_thresholds')
      .select('core_requirement')
      .gt('level', data.level)
      .order('level', { ascending: true })
      .limit(1)
      .single()

    const nextLevelRequirement = nextLevelData?.core_requirement || data.aicore_balance * 2

    return {
      success: true,
      walletBalance: Number.parseFloat(data.wallet_balance),
      coreBalance: Number.parseFloat(data.aicore_balance),
      level: data.level,
      nextLevelRequirement,
      userId: data.id,
    }
  } catch (error) {
    console.error("Error in getUserBalances:", error)
    return { 
      success: false, 
      error: "Failed to fetch user balances", 
      walletBalance: 0, 
      coreBalance: 0, 
      level: 0,
      userId: null 
    }
  }
}

export async function topUpWalletBalance(amount: number, userId: string) {
  try {
    if (!userId) return { success: false, error: "User ID is required" }
    if (amount <= 0) return { success: false, error: "Amount must be greater than zero" }

    const supabase = createServerSupabaseClient()

    // Используем транзакцию для безопасного обновления
    const { data, error } = await supabase.rpc('top_up_wallet', {
      p_user_id: userId,
      p_amount: amount
    })

    if (error) {
      console.error("Error in top up:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/")
    return { success: true, newBalance: data.new_balance }
  } catch (error) {
    console.error("Error in topUpWalletBalance:", error)
    return { success: false, error: "Failed to top up wallet balance" }
  }
}

export async function transferToCore(amount: number, userId: string) {
  try {
    if (!userId) return { success: false, error: "User ID is required" }
    if (amount <= 0) return { success: false, error: "Amount must be greater than zero" }

    const supabase = createServerSupabaseClient()

    // Используем хранимую процедуру для безопасного перевода и обновления уровня
    const { data, error } = await supabase.rpc('transfer_to_core', {
      p_user_id: userId,
      p_amount: amount
    })

    if (error) {
      console.error("Error in transfer:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/")
    return {
      success: true,
      newWalletBalance: data.new_wallet_balance,
      newCoreBalance: data.new_core_balance,
      newLevel: data.new_level
    }
  } catch (error) {
    console.error("Error in transferToCore:", error)
    return { success: false, error: "Failed to transfer to core" }
  }
}

// Безопасная функция для получения информации об уровне
export async function getLevelInfo(userId: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('level, aicore_balance')
      .eq('id', userId)
      .single()
    
    if (userError) throw new Error(userError.message)

    const { data: nextLevelData } = await supabase
      .from('level_thresholds')
      .select('level, core_requirement')
      .gt('level', userData.level)
      .order('level', { ascending: true })
      .limit(1)
      .single()

    return {
      success: true,
      currentLevel: userData.level,
      currentBalance: userData.aicore_balance,
      nextLevel: nextLevelData?.level,
      nextLevelRequirement: nextLevelData?.core_requirement
    }
  } catch (error) {
    console.error("Error in getLevelInfo:", error)
    return { 
      success: false, 
      error: "Failed to get level info",
      currentLevel: 0,
      currentBalance: 0
    }
  }
}

