"use client"

import { useState, useEffect } from "react"
import { Calendar, Tag, ChevronDown, ChevronUp, Check, User, Trophy } from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useUser } from "@/components/UserContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import Link from "next/link"
import TaskUpdater from "@/components/TaskUpdater"
import { useTaskVerification } from '@/hooks/useTaskVerification'

// Define level thresholds (adjust if needed)
const levelThresholds = [
  { level: 1, core: 2 },
  { level: 2, core: 4 },
  { level: 3, core: 8 },
  { level: 4, core: 16 },
  { level: 5, core: 32 },
  { level: 6, core: 64 },
  { level: 7, core: 125 },
  { level: 8, core: 250 },
  { level: 9, core: 500 },
  { level: 10, core: 1000 },
  { level: 11, core: 2000 },
  // Add more levels as needed following the doubling pattern (or adjust)
];

// Function to calculate level based on core
const calculateLevel = (core: number): number => {
  let calculatedLevel = 0;
  for (let i = levelThresholds.length - 1; i >= 0; i--) {
    if (core >= levelThresholds[i].core) {
      calculatedLevel = levelThresholds[i].level;
      break; // Found the highest applicable level
    }
  }
  return calculatedLevel; // Return 0 if core is below the first threshold
};

// Initialize Supabase client
const supabase = createClientSupabaseClient();

type Task = {
  number: number
  title: string
  reward: number
  icon_url: string
  description: string
  completion_condition: string
  due_date: string | null
  notes: string
  status: string
  assigned_at: string
  current_step_index: number
  progress_details: string
  steps_total?: number
}

export default function TasksTab() {
  const { dbUser, isLoading: isUserLoading, refreshUserData, goals } = useUser()

  const [activeTab, setActiveTab] = useState("new")
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [completionModal, setCompletionModal] = useState<{
    isOpen: boolean;
    taskNumber: number;
    reward: number;
    oldCore?: number;
    newCore?: number;
  } | null>(null)
  const [levelUpModal, setLevelUpModal] = useState<{
    isOpen: boolean;
    newLevel: number | null;
    oldLevel: number | null; // Optional: To show the transition
  } | null>(null);
  const [isUpdatingLevel, setIsUpdatingLevel] = useState(false); // To prevent multiple updates

  const { verifying, handleTaskVerification }: { verifying: boolean; handleTaskVerification: (taskNumber: number, currentGoals: any[] | null) => Promise<void> } = useTaskVerification({
    dbUser,
    refreshUserData,
    setStatusMessage,
    onTaskComplete: (taskNumber: number, reward: number, oldCore: number, newCore: number) => {
      setCompletionModal({
        isOpen: true,
        taskNumber,
        reward,
        oldCore,
        newCore
      });
    }
  })

  useEffect(() => {
    if (dbUser?.id) {
      fetchTasks()
    } else if (!isUserLoading) {
      setLoading(false)
    }
  }, [dbUser?.id, isUserLoading])

  // Effect to check for level up
  useEffect(() => {
    if (dbUser && !isUserLoading && !isUpdatingLevel) {
      const currentAiCoreBalance = dbUser.aicore_balance || 0;
      const currentLevel = dbUser.level || 0; // Assuming dbUser has a 'level' field
      const calculatedLevel = calculateLevel(currentAiCoreBalance);

      console.log(`Checking level: AICoreBalance=${currentAiCoreBalance}, CurrentLevel=${currentLevel}, CalculatedLevel=${calculatedLevel}`); // Update log

      if (calculatedLevel > currentLevel) {
        console.log(`Level up detected! ${currentLevel} -> ${calculatedLevel}`); // Debug log
        setIsUpdatingLevel(true); // Lock to prevent race conditions

        // Update level in Supabase
        const updateUserLevel = async () => {
          try {
            const { error } = await supabase
              .from('users') // Make sure 'users' table name is correct
              .update({ level: calculatedLevel }) // Make sure 'level' column name is correct
              .eq('id', dbUser.id);

            if (error) {
              console.error("Error updating user level:", error);
              setStatusMessage({ type: 'error', text: `Failed to update level: ${error.message}` });
              setIsUpdatingLevel(false); // Unlock on error
            } else {
              console.log(`User level updated successfully to ${calculatedLevel}`); // Debug log
              // Show level up modal AFTER db update is successful
              setLevelUpModal({
                isOpen: true,
                newLevel: calculatedLevel,
                oldLevel: currentLevel
              });
              // Refresh user data to get the updated level from DB *after* modal is closed
              // No need to set isUpdatingLevel back immediately, let the modal close handle it
            }
          } catch (err) {
            console.error("Unexpected error updating level:", err);
            setStatusMessage({ type: 'error', text: 'An unexpected error occurred while updating level.' });
            setIsUpdatingLevel(false); // Unlock on unexpected error
          }
        };

        updateUserLevel();
      }
    }
  }, [dbUser?.aicore_balance, dbUser?.level, isUserLoading, isUpdatingLevel, dbUser?.id, refreshUserData, setStatusMessage]); // Update dependency

  const fetchTasks = async () => {
    if (!dbUser?.id) return;
    
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("user_tasks")
        .select(`
          *,
          task:tasks(*)
        `)
        .eq("user_id", dbUser.id)
        .order("assigned_at", { ascending: false })

      if (error) {
        console.error("Error fetching tasks:", error)
        setError("Failed to fetch tasks. Please try again later.")
      } else {
        // Transform the data to match the Task interface
        const transformedTasks = data.map(userTask => ({
          ...userTask.task,
          status: userTask.status,
          assigned_at: userTask.assigned_at,
          current_step_index: userTask.current_step_index,
          progress_details: userTask.progress_details,
          steps_total: userTask.task.steps_total
        }))
        setTasks(transformedTasks)
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const toggleTaskExpansion = (taskNumber: number) => {
    if (expandedTaskId === taskNumber) {
      setExpandedTaskId(null)
    } else {
      setExpandedTaskId(taskNumber)
    }
  }

  const filteredTasks = () => {
    switch (activeTab) {
      case "new":
        return tasks.filter((task) => task.status === 'assigned' || task.status === 'in_progress')
      case "completed":
        return tasks.filter((task) => task.status === 'completed')
      default:
        return tasks.filter((task) => task.status === 'assigned' || task.status === 'in_progress')
    }
  }

  if (isUserLoading) {
    return <div className="flex items-center justify-center h-full">Loading user data...</div>
  }

  if (!dbUser?.id) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center flex flex-col items-center gap-4">
              <h3 className="text-lg font-medium">Access to Tasks</h3>
              <p className="text-gray-500 mb-4">To access your tasks, please log in to the system</p>
              <Avatar className="h-20 w-20 mx-auto mb-2">
                <AvatarFallback>
                  <User className="h-10 w-10 text-gray-400" />
                </AvatarFallback>
              </Avatar>
              
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 px-6"
                onClick={() => {
                  const socialButton = document.querySelector('button[aria-label="Social"]');
                  if (socialButton instanceof HTMLElement) {
                    socialButton.click();
                  }
                }}
              >
                <User className="h-5 w-5" />
                Go to Profile
              </Button>

              <p className="text-xs text-gray-400 mt-4">
                After logging in, you will get access to all application features
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading tasks...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-red-500">{error}</div>
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Status Message */}
      {statusMessage && (
        <div className={`p-3 text-sm ${
          statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        } transition-opacity duration-500`}>
          {statusMessage.text}
        </div>
      )}
      
      {/* Completion Modal */}
      <Dialog open={completionModal?.isOpen} onOpenChange={(open) => {
        if (!open) {
          setCompletionModal(null);
          fetchTasks(); // Refresh tasks when closing the modal
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Task Completed!
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="text-center space-y-4">
              <p className="text-lg font-medium">Congratulations!</p>
              <p className="text-gray-600">
                You've successfully completed Task {completionModal?.taskNumber}
              </p>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-700 mb-2">Rewards:</p>
                <div className="flex justify-center items-center gap-2 text-2xl font-bold text-purple-700">
                  +${completionModal?.reward}
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">Core Progress:</p>
                <div className="flex justify-center items-center gap-2">
                  <span className="text-xl text-blue-700">${completionModal?.oldCore || 0}</span>
                  <ChevronUp className="h-6 w-6 text-green-500" />
                  <span className="text-2xl font-bold text-blue-700">${completionModal?.newCore || 0}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="w-full"
              onClick={() => {
                setCompletionModal(null);
                fetchTasks(); // Refresh tasks when clicking Continue
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Level Up Modal */}
      <Dialog open={levelUpModal?.isOpen} onOpenChange={(open) => {
        if (!open) {
          setLevelUpModal(null);
          setIsUpdatingLevel(false); // Unlock when modal closes
          refreshUserData(); // Refresh user data to ensure UI consistency
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Level Up!
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="text-center space-y-4">
              <p className="text-lg font-medium">Congratulations!</p>
              <p className="text-gray-600">
                You've reached Level <span className="font-bold text-purple-600">{levelUpModal?.newLevel}</span>!
              </p>
              <div className="bg-purple-50 p-4 rounded-lg">
                 <p className="text-sm text-purple-700 mb-2">Keep growing your Core!</p>
                 {/* You could add the next level's requirement here */}
                 {levelUpModal?.newLevel && levelUpModal.newLevel < levelThresholds.length && (
                    <p className="text-xs text-purple-600">
                        Next level at ${levelThresholds[levelUpModal.newLevel].core} Core.
                    </p>
                 )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => {
                setLevelUpModal(null);
                setIsUpdatingLevel(false); // Unlock when modal closes
                refreshUserData(); // Refresh user data
              }}
            >
              Awesome!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs and TaskUpdater */}
      <div className="flex items-center justify-between p-2 bg-white border-b">
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              activeTab === "new" ? "bg-purple-500 text-white" : "bg-white text-gray-700"
            }`}
            onClick={() => setActiveTab("new")}
          >
            New
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              activeTab === "completed" ? "bg-purple-500 text-white" : "bg-white text-gray-700"
            }`}
            onClick={() => setActiveTab("completed")}
          >
            Completed
          </button>
        </div>
        <TaskUpdater onUpdate={fetchTasks} />
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {filteredTasks().map((task) => (
          <div key={task.number} className="border-b">
            {/* Task header - Modified to include button */}
            <div className="flex items-center p-4">
              {/* Icon */}
              <img
                src={task.icon_url || "/placeholder.svg"}
                alt={task.title}
                className="flex-shrink-0 w-8 h-8 rounded-full object-cover mr-3"
              />

              {/* Title and Meta (Takes remaining space) */}
              <div className="flex-1 min-w-0 mr-4" onClick={() => toggleTaskExpansion(task.number)} style={{ cursor: 'pointer' }}>
                <h3 className="text-base text-gray-800 truncate">
                  {task.title}
                </h3>
                <div className="flex flex-wrap items-center mt-1 text-xs text-gray-500">
                  <div className="flex items-center mr-3">
                    <Calendar className="h-3 w-3 mr-1" />
                    {task.assigned_at ? new Date(task.assigned_at).toLocaleDateString() : "Not started"}
                  </div>
                  <div className="flex items-center mr-3">
                    <Tag className="h-3 w-3 mr-1" />
                    {task.reward}$
                  </div>
                  <div className={`flex items-center ${
                    task.status === 'completed' ? 'text-green-500' :
                    task.status === 'in_progress' ? 'text-blue-500' :
                    'text-gray-500'
                  }`}>
                    {task.status}
                  </div>
                </div>
              </div>

              {/* Actions (Button and Chevron) */}
              <div className="flex items-center space-x-2">
                {task.status !== 'completed' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => { 
                      e.stopPropagation();
                      handleTaskVerification(task.number, goals);
                    }}
                    disabled={verifying}
                  >
                    {verifying ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800 mr-2"></span>
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Check
                  </Button>
                )}
                <div onClick={() => toggleTaskExpansion(task.number)} style={{ cursor: 'pointer' }}>
                  {expandedTaskId === task.number ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded task details */}
            {expandedTaskId === task.number && (
              <div className="px-4 pb-4 pt-0">
                <div className="ml-11">
                  <div className="mb-3">
                    <p className="text-sm text-gray-700">{task.description}</p>
                  </div>

                  {task.current_step_index !== null && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <h4 className="text-xs font-medium text-gray-700 mb-2">Progress:</h4>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${(task.current_step_index / (task.steps_total || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600">Step {task.current_step_index + 1} of {task.steps_total || '?'}</p>
                    </div>
                  )}

                  {task.notes && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Notes:</h4>
                      <p className="text-xs text-gray-600">{task.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

