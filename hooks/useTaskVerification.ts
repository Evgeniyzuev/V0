import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
// Remove the explicit import for User if it's causing an error
// import { User } from '@/lib/types'; 
// Import the hook itself to infer the type (adjust path if needed)
import { useUser } from '@/components/UserContext'; 

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

  const handleTaskVerification = async (taskNumber: number) => {
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
      }
      // Add more task verifications here
      // --- End task verification logic ---

      console.log(`Verification result for task ${taskNumber}: ${success ? 'Success' : 'Failure'}`);

      if (success) {
        // Get current core value before update
        const { data: currentUser } = await supabase
          .from('profiles')
          .select('core')
          .eq('id', dbUser.id)
          .single();

        const oldCore = currentUser?.core || 0;

        // Begin a transaction to update both user_tasks and profiles
        const { error: updateError } = await supabase.rpc('complete_task', {
          p_user_id: dbUser.id,
          p_task_id: taskNumber,
          p_reward_amount: task.reward
        });

        if (updateError) throw updateError;

        // Get the updated core value after complete_task
        const { data: updatedUser, error: fetchError } = await supabase
          .from('profiles')
          .select('core')
          .eq('id', dbUser.id)
          .single();

        if (fetchError) throw fetchError;

        const newCore = updatedUser?.core || oldCore;

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
      setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
      setVerifying(false);
    }
  };

  return { verifying, handleTaskVerification };
}
