import { useState } from 'react';
// Remove the explicit import for User if it's causing an error
// import { User } from '@/lib/types'; 
// Import the hook itself to infer the type (adjust path if needed)
import { useUser } from '@/components/UserContext'; 

type StatusMessage = { type: 'success' | 'error'; text: string } | null;

// Infer the User type from the return type of useUser
type DbUserType = ReturnType<typeof useUser>['dbUser'];

interface UseTaskVerificationProps {
  dbUser: DbUserType; // Use the inferred type
  refreshUserData: () => Promise<void>;
  setStatusMessage: (message: StatusMessage) => void;
}

/**
 * Custom hook to handle task verification logic.
 * Manages verification state and provides a function to trigger verification.
 */
export function useTaskVerification({
  dbUser,
  refreshUserData,
  setStatusMessage,
}: UseTaskVerificationProps) {
  const [verifying, setVerifying] = useState(false);

  const handleTaskVerification = async (taskNumber: number) => {
    if (verifying) return; // Prevent multiple simultaneous verifications
    setVerifying(true);
    console.log(`Starting verification for task ${taskNumber}...`); // Added console log

    // Default result is failure
    let success = false;
    let message = `Task ${taskNumber} not completed. Requirements not met.`;

    try {
      // --- Task verification logic ---
      // Specific logic for task #1
      if (taskNumber === 1) {
        // Now uses the inferred type, property access remains the same
        success = !!dbUser?.id; // Check if user ID exists 
        message = success
          ? `Task ${taskNumber}: Congratulations! Task completed successfully.`
          : `Task ${taskNumber}: Task not completed. You must be logged in.`;
      }
      // TODO: Add verification logic for other task numbers here
      // Example:
      // else if (taskNumber === 2) {
      //   // Call an API or check some condition
      //   // const result = await checkSomeConditionForTask2();
      //   // success = result.isSuccess;
      //   // message = result.feedbackMessage;
      // }
      // --- End task verification logic ---

      console.log(`Verification result for task ${taskNumber}: ${success ? 'Success' : 'Failure'}`); // Added console log

      // Update status message based on verification outcome
      if (success) {
        setStatusMessage({ type: 'success', text: message });
        // Refresh user data only on success, e.g., to update balance or task status
        console.log(`Task ${taskNumber} successful, refreshing user data...`); // Added console log
        await refreshUserData();
      } else {
        setStatusMessage({ type: 'error', text: message });
      }
    } catch (error) {
      console.error(`Error verifying task ${taskNumber}:`, error);
      // Set a generic error message in case of unexpected errors during verification
      setStatusMessage({ type: 'error', text: `An error occurred during verification for task ${taskNumber}.` });
      success = false; // Ensure failure state on error
    } finally {
      // Clear the status message after 3 seconds regardless of outcome
      setTimeout(() => {
        setStatusMessage(null);
        console.log(`Cleared status message for task ${taskNumber}.`); // Added console log
      }, 3000);
      // Reset verification state
      setVerifying(false);
      console.log(`Finished verification process for task ${taskNumber}.`); // Added console log
    }
  };

  // Return the verification state and the handler function
  return { verifying, handleTaskVerification };
}
