import { useState, useCallback } from 'react';
import { createClientSupabaseClient } from "@/lib/supabase"
// Remove the explicit import for User if it's causing an error
// import { User } from '@/lib/types'; 
// Import the hook itself to infer the type (adjust path if needed)
import { useUser } from '@/components/UserContext'; 

// Initialize Supabase client
const supabase = createClientSupabaseClient();

type StatusMessage = { type: 'success' | 'error'; text: string } | null;

// Infer the User type from the return type of useUser
type DbUserType = ReturnType<typeof useUser>['dbUser'];

interface UseTaskVerificationProps {
  dbUser: DbUserType;
  refreshUserData: () => Promise<void>;
  setStatusMessage: (message: StatusMessage) => void;
  onTaskComplete?: (taskNumber: number, reward: number, oldCore: number, newCore: number) => void;
}

/**
 * Custom hook to handle task verification logic.
 * Manages verification state and provides a function to trigger verification.
 */
export function useTaskVerification({
  dbUser,
  refreshUserData,
  setStatusMessage,
  onTaskComplete
}: UseTaskVerificationProps) {
  const [verifying, setVerifying] = useState(false);

  const verifyTask = async (taskNumber: number) => {
    await handleTaskVerification(taskNumber, null);
  };

  // Wrap handleTaskVerification in useCallback
  const handleTaskVerification = useCallback(async (taskNumber: number, currentGoals: any[] | null, taskState?: any) => {
    // Check dbUser?.id inside the callback where it has the latest value
    if (verifying || !dbUser?.id) return;
    setVerifying(true);
    console.log(`Starting verification for task ${taskNumber}...`);

    try {
      // 1. Check task status
      const { data: userTask, error: statusError } = await supabase
        .from('user_tasks')
        .select('status, task_id')
        .eq('user_id', dbUser.id)
        .eq('task_id', taskNumber)
        .single();

      if (statusError) throw statusError;

      if (!userTask) {
        setStatusMessage({ type: 'error', text: `Task ${taskNumber} not found.` });
        return;
      }

      if (userTask.status !== 'assigned' && userTask.status !== 'in_progress') {
        setStatusMessage({ 
          type: 'error', 
          text: `Task ${taskNumber} cannot be verified in its current status: ${userTask.status}` 
        });
        return;
      }

      // 2. Get task reward
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('reward')
        .eq('number', taskNumber)
        .single();

      if (taskError) throw taskError;

      // Default result is failure
      let success = false;
      let message = `Task ${taskNumber} not completed. Requirements not met.`;

      // --- Task verification logic ---
      if (taskNumber === 1) {
        success = !!dbUser.id;
        message = success
          ? `Task ${taskNumber}: Congratulations! Task completed successfully.`
          : `Task ${taskNumber}: Task not completed. You must be logged in.`;
      } else if (taskNumber === 2) {
        // Четкое сообщение о количестве целей
        const goalsCount = currentGoals?.length || 0;
        success = goalsCount > 1;
        message = success
          ? `Задание ${taskNumber} выполнено! У вас ${goalsCount} целей.`
          : `Задание ${taskNumber} не выполнено. У вас ${goalsCount} целей, нужно больше одной цели.`;
      } else if (taskNumber === 3) {
        // Check if user has used the Time to Target calculator
        const hasCalculated = localStorage.getItem('timeToTargetCalculated') === 'true';
        success = hasCalculated;
        message = success
          ? `Задание ${taskNumber} выполнено! Вы успешно использовали калькулятор времени до цели.`
          : `Задание ${taskNumber} не выполнено. Перейдите на вкладку Core, введите целевую сумму и нажмите Calculate.`;
      }
      // Add more task verifications here
      // --- End task verification logic ---

      console.log(`Verification result for task ${taskNumber}: ${success ? 'Success' : 'Failure'}`);

      if (success) {
        // Get current core value before update
        const { data: currentUser } = await supabase
          .from('users')
          .select('aicore_balance')
          .eq('id', dbUser.id) // Use dbUser.id from the closure
          .single();

        const oldCore = currentUser?.aicore_balance || 0;

        // Begin a transaction to update both user_tasks and profiles
        const { error: updateError } = await supabase.rpc('complete_task', {
          p_user_id: dbUser.id, // Use dbUser.id from the closure
          p_task_id: taskNumber,
          p_reward_amount: task.reward
        });

        if (updateError) throw updateError;

        // Get updated core value
        const { data: updatedUser } = await supabase
          .from('users')
          .select('aicore_balance')
          .eq('id', dbUser.id) // Use dbUser.id from the closure
          .single();

        const newCore = updatedUser?.aicore_balance || 0;

        // Call onTaskComplete if provided
        if (onTaskComplete) {
          onTaskComplete(taskNumber, task.reward, oldCore, newCore);
        }

        setStatusMessage({ type: 'success', text: message });
        await refreshUserData();
      } else {
        setStatusMessage({ type: 'error', text: message });
      }
    } catch (error: any) {
      console.error(`Error verifying task ${taskNumber}:`, error);
      setStatusMessage({ 
        type: 'error', 
        text: `An error occurred during verification for task ${taskNumber}: ${error.message}` 
      });
    } finally {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
      setVerifying(false);
      // Optional: Clear timeout if component unmounts before 3s
      // return () => clearTimeout(timer);
    }
  }, [
    // Add dependencies: props used inside the callback
    verifying, 
    dbUser, 
    refreshUserData, 
    setStatusMessage, 
    onTaskComplete
  ]);

  return {
    verifying,
    handleTaskVerification,
    verifyTask,
  };
}
