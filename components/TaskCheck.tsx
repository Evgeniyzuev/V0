"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser } from "@/components/UserContext"

interface TaskCheckProps {
  taskNumber: number
  onComplete: (success: boolean, message: string) => void
  onCancel: () => void
}

export default function TaskCheck({ taskNumber, onComplete, onCancel }: TaskCheckProps) {
  const { dbUser } = useUser()
  const [loading, setLoading] = useState(false)

  const verifyTask = async () => {
    setLoading(true)
    
    setTimeout(() => {
      // Default result is failure
      let success = false;
      let message = "Task not completed. Requirements not met.";
      
      // Special case for task #1: just check if user is logged in
      if (taskNumber === 1) {
        success = !!dbUser?.id;
        message = success 
          ? "Congratulations! Task completed successfully." 
          : "Task not completed. You must be logged in.";
      }
      
      setLoading(false);
      onComplete(success, message);
    }, 1000); // Simulate processing time
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Task Verification</h3>
      
      {loading ? (
        <div className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            Verify task completion for task #{taskNumber}
          </p>
          
          <div className="flex gap-3 mt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              onClick={verifyTask}
            >
              <Check className="h-4 w-4 mr-2" />
              Verify
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 