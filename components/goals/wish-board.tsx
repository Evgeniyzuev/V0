"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Edit, X, DollarSign, CheckSquare, User, Plus } from "lucide-react"
import AddWish from "./add-wish"
import TaskEditor from "@/components/tasks/TaskEditor"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useUser } from "@/components/UserContext"
import { fetchGoals, updateGoal, updateUserGoal, removeUserGoal } from "@/lib/api/goals"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Goal, UserGoal } from "@/types/supabase"
import { toast } from "sonner"
import GoalUpdater, { type GoalUpdaterRef } from "./GoalUpdater"

// Функция для получения изображения из localStorage или возврата URL
const getImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return ""

  // Проверяем, является ли это ID изображения в localStorage
  if (imageUrl.startsWith("wish_image_")) {
    const storedImage = localStorage.getItem(imageUrl)
    return storedImage || ""
  }

  // Возвращаем обычный URL
  return imageUrl
}

const personalGoals: Goal[] = [
  {
    id: 1,
    created_at: new Date().toISOString(),
    title: "Get the First Level",
    description: "Advance through the first milestone in your personal development.",
    image_url:
      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    estimated_cost: "Free",
    difficulty_level: 0,
    steps: ["Watch all tutorial videos", "Complete practice exercises", "Pass the level 1 assessment"],
  },
  {
    id: 2,
    created_at: new Date().toISOString(),
    title: "Travel to Japan",
    description: "Visit Tokyo, Kyoto, and Mount Fuji during cherry blossom season.",
    image_url:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8amFwYW58ZW58MHx8MHx8fDA%3D",
    estimated_cost: "$5,000",
    difficulty_level: 13,
    steps: [
      "Save $5,000 for the trip",
      "Research and book flights",
      "Plan itinerary for Tokyo, Kyoto, and Osaka",
      "Learn basic Japanese phrases",
      "Apply for Japan visa",
    ],
  },
]

interface WishBoardProps {
  showOnlyRecommendations: boolean
}

const WishBoard: React.FC<WishBoardProps> = ({ showOnlyRecommendations }) => {
  const { dbUser, goals: userGoals, refreshGoals } = useUser()
  const queryClient = useQueryClient()

  // Fetch goals from the database (only template goals)
  const {
    data: goals = [],
    isLoading: isLoadingGoals,
    error: goalsError,
  } = useQuery({
    queryKey: ["goals"],
    queryFn: fetchGoals,
  })

  const goalUpdaterRef = useRef<GoalUpdaterRef>(null)
  const goalUpdater = dbUser?.id ? (
    <GoalUpdater
      ref={goalUpdaterRef}
      goals={goals}
      onGoalAdded={refreshGoals} // Add callback to refresh goals in context
    />
  ) : null

  const [selectedWish, setSelectedWish] = useState<Goal | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedDescription, setEditedDescription] = useState("")
  const [editedSteps, setEditedSteps] = useState<string[]>([])
  const [editedTargetDate, setEditedTargetDate] = useState("")
  const [editedEstimatedCost, setEditedEstimatedCost] = useState("")
  const [editedProgress, setEditedProgress] = useState(0)
  const [editedDifficultyLevel, setEditedDifficultyLevel] = useState(0)
  const [isAddWishModalOpen, setIsAddWishModalOpen] = useState(false)
  const [taskEditorOpen, setTaskEditorOpen] = useState(false)
  const [taskEditorInitial, setTaskEditorInitial] = useState<any | null>(null)

  // Check if a goal is in user's personal goals
  const isGoalInPersonalGoals = (goalId: number) => {
    return userGoals?.some((userGoal) => userGoal.goal_id === goalId) ?? false
  }

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Goal> }) => updateGoal(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] })
      toast.success("Goal updated successfully")
    },
    onError: (error) => {
      console.error("Error updating goal:", error)
      toast.error("Failed to update goal")
    },
  })

  // Update user goal mutation
  const updateUserGoalMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<UserGoal> }) => updateUserGoal(id, updates),
    onSuccess: async (data) => {
      // Invalidate and refetch user goals to ensure UI updates
      await queryClient.invalidateQueries({ queryKey: ["user-goals"] })
      await refreshGoals() // Refresh goals in context

      // Update local state with the new data
      if (data && selectedWish) {
        const updatedWish: Goal = {
          id: selectedWish.id,
          title: data.title || selectedWish.title,
          description: data.description || selectedWish.description,
          image_url: data.image_url || selectedWish.image_url,
          estimated_cost: data.estimated_cost || selectedWish.estimated_cost,
          difficulty_level: data.difficulty_level ?? selectedWish.difficulty_level,
          steps: data.steps || selectedWish.steps,
          created_at: selectedWish.created_at,
        }
        setSelectedWish(updatedWish)
        // Update form fields with new data
        setEditedTitle(updatedWish.title || "")
        setEditedDescription(updatedWish.description || "")
        setEditedSteps(updatedWish.steps || [])
        setEditedEstimatedCost(updatedWish.estimated_cost || "")
        setEditedDifficultyLevel(updatedWish.difficulty_level || 0)
      }
      toast.success("Personal goal updated successfully")
    },
    onError: (error) => {
      console.error("Error updating user goal:", error)
      toast.error("Failed to update personal goal")
    },
  })

  const handleWishClick = (wish: Goal) => {
    setSelectedWish(wish)
    setEditedTitle(wish.title ?? "")
    setEditedDescription(wish.description || "")
    setEditedSteps(wish.steps || [])
    setEditedEstimatedCost(wish.estimated_cost || "")
    setEditedDifficultyLevel(wish.difficulty_level || 0)
    setIsEditing(false)
  }

  // Add new state to track which section the goal is from
  const [isFromPersonalGoals, setIsFromPersonalGoals] = useState(false)

  // Modify click handlers to set the source section
  const handlePersonalGoalClick = (goal: UserGoal) => {
    setIsFromPersonalGoals(true)
    const goalForModal: Goal & { goal_id?: number } = {
      id: goal.id,
      title: goal.title || goal.goal?.title || "",
      description: goal.description || goal.goal?.description || "",
      image_url: goal.image_url || "",
      estimated_cost: goal.estimated_cost || "",
      difficulty_level: goal.difficulty_level || 0,
      steps: goal.steps || [],
      created_at: goal.created_at,
      // Preserve goal_id for deletion
      ...(goal.goal_id && { goal_id: goal.goal_id }),
    }
    handleWishClick(goalForModal)
  }

  const handleAvailableGoalClick = (goal: Goal) => {
    setIsFromPersonalGoals(false)
    handleWishClick(goal)
  }

  const closeModal = () => {
    setSelectedWish(null)
    setIsEditing(false)
  }

  const closeAddWishModal = () => {
    setIsAddWishModalOpen(false)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    if (!selectedWish) return

    if (isFromPersonalGoals) {
      // Update user goal in user_goals table
      updateUserGoalMutation.mutate({
        id: selectedWish.id,
        updates: {
          title: editedTitle,
          description: editedDescription,
          steps: editedSteps,
          estimated_cost: editedEstimatedCost,
          difficulty_level: editedDifficultyLevel,
        },
      })
    } else {
      // Update goal template in goals table
      updateGoalMutation.mutate({
        id: selectedWish.id,
        updates: {
          title: editedTitle,
          description: editedDescription,
          steps: editedSteps,
          estimated_cost: editedEstimatedCost,
          difficulty_level: editedDifficultyLevel,
        },
      })
    }

    setIsEditing(false)
  }

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...editedSteps]
    newSteps[index] = value
    setEditedSteps(newSteps)
  }

  const addStep = () => {
    setEditedSteps([...editedSteps, ""])
  }

  const removeStep = (index: number) => {
    const newSteps = [...editedSteps]
    newSteps.splice(index, 1)
    setEditedSteps(newSteps)
  }

  const handleAddToPersonalGoals = async (goal: Goal) => {
    if (!dbUser?.id) {
      toast.error("Please log in to add goals")
      return
    }
    if (!goalUpdaterRef.current) {
      toast.error("Goal updater not initialized")
      return
    }

    try {
      await goalUpdaterRef.current.addGoalToUserGoals(goal)
      closeModal()
    } catch (error) {
      console.error("Error adding goal:", error)
      toast.error("Failed to add goal: " + (error as Error).message)
    }
  }

  const handleRemoveFromPersonalGoals = async (goal: Goal) => {
    if (!dbUser?.id) {
      toast.error("Please log in to remove goals")
      return
    }

    try {
      const goalId = goal.id
      console.log("[v0] Removing goal with goal_id:", goalId, "for user:", dbUser.id)
      await removeUserGoal(dbUser.id, goalId)
      await refreshGoals()
      closeModal()
      toast.success("Goal removed from personal goals")
    } catch (error) {
      console.error("Error removing goal:", error)
      toast.error("Failed to remove goal: " + (error as Error).message)
    }
  }

  if (dbUser?.id && (isLoadingGoals || !userGoals)) {
    return <div className="py-4">Loading goals...</div>
  }

  if (dbUser?.id && goalsError) {
    return <div className="py-4 text-red-500">Error loading goals: {goalsError.message}</div>
  }

  return (
    <div className="py-4 space-y-2">
      {goalUpdater}
      {!dbUser?.id ? (
        <>
          {/* Auth UI for unauthenticated users */}
          <div className="mb-2">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center flex flex-col items-center gap-4">
                  <h3 className="text-lg font-medium">Access to Personal Goals</h3>
                  <p className="text-gray-500 mb-4">To access your personal goals, please log in to the system</p>
                  <Avatar className="h-20 w-20 mx-auto mb-2">
                    <AvatarFallback>
                      <User className="h-10 w-10 text-gray-400" />
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 px-6"
                    onClick={() => {
                      const socialButton = document.querySelector('button[aria-label="Social"]')
                      if (socialButton instanceof HTMLElement) {
                        socialButton.click()
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

          {/* Show recommendations for unauthorized users */}
          {showOnlyRecommendations && !isLoadingGoals && (
            <div>
              {/* <h3 className="text-lg font-semibold mb-2 px-4">Recommended Goals</h3> */}
              <div className="grid grid-cols-3 gap-1">
                {[...goals].sort((a, b) => b.id - a.id).map((goal) => (
                  <div
                    key={goal.id}
                    className="image-item animate-fade-in rounded overflow-hidden shadow-md aspect-square cursor-pointer"
                    onClick={() => handleWishClick(goal)}
                  >
                  <div className="relative w-full h-full">
                    <img
                      src={getImageUrl(goal.image_url) || "/placeholder.svg"}
                      alt={goal.title ?? "Goal image"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
                      <div className="p-3 text-white">
                        <div className="text-sm font-medium">{goal.title}</div>
                      </div>
                    </div>
                  </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Personal Goals Section for authenticated users */}
          <div className="mb-4">
            {/* <div className="flex items-center justify-between px-4">
              <h2 className="text-xl font-semibold">Your Personal Goals: {userGoals?.length || 0}</h2>
            </div> */}
            <div className="grid grid-cols-3 gap-1">
              {(userGoals || []).filter(Boolean).map((goal) => (
                <div
                  key={goal?.id || Math.random()}
                  className="image-item animate-fade-in rounded overflow-hidden shadow-md aspect-square cursor-pointer"
                  onClick={() => goal && handlePersonalGoalClick(goal)}
                >
                  <div className="relative w-full h-full">
                    <img
                      src={getImageUrl(goal?.image_url) || "/placeholder.svg"}
                      alt={goal?.title || goal?.goal?.title || ""}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* small overlay action buttons */}
                    <div className="absolute bottom-2 right-2 flex flex-col gap-2 opacity-0 hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setTaskEditorInitial({
                            title: goal?.title || goal?.goal?.title || "",
                            description: goal?.description || goal?.goal?.description || "",
                            image_url: goal?.image_url || undefined,
                            estimated_cost: goal?.estimated_cost || undefined,
                            difficulty_level: goal?.difficulty_level || 0,
                          })
                          setTaskEditorOpen(true)
                        }}
                        className="bg-white/90 text-sm text-gray-700 px-2 py-1 rounded shadow-sm border border-gray-200"
                      >
                        +Task
                      </button>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
                      <div className="p-3 text-white">
                        <div className="text-sm font-medium">{goal?.title || goal?.goal?.title}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Wish Card */}
              <div
                className="image-item animate-fade-in rounded overflow-hidden shadow-md aspect-square cursor-pointer bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all duration-300 flex flex-col items-center justify-center border-2 border-green-200 hover:border-green-300 hover:shadow-lg transform hover:scale-105"
                onClick={() => setIsAddWishModalOpen(true)}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Plus className="h-16 w-16 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Add Wish</span>
                </div>
              </div>
            </div>
          </div>

          {/* Available Goals section for authenticated users */}
          <div>
            {/* <h3 className="text-lg font-semibold mb-2 px-4">Available Goals</h3> */}
            <div className="grid grid-cols-3 gap-1">
              {[...goals].sort((a, b) => b.id - a.id).map((goal) => (
                <div
                  key={goal.id}
                  className="image-item animate-fade-in rounded overflow-hidden shadow-md aspect-square cursor-pointer"
                  onClick={() => handleAvailableGoalClick(goal)}
                >
                  <div className="relative w-full h-full">
                    <img
                      src={getImageUrl(goal.image_url) || "/placeholder.svg"}
                      alt={goal.title ?? "Goal image"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
                      <div className="p-3 text-white">
                        <div className="text-sm font-medium">{goal.title}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Goal Detail Modal */}
      {selectedWish && (
        <Dialog open={!!selectedWish} onOpenChange={() => closeModal()}>
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="relative">
                <img
                  src={getImageUrl(selectedWish.image_url) || "/placeholder.svg"}
                  alt={selectedWish.title ?? "Goal image"}
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={closeModal}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                      <input
                        type="number"
                        value={editedDifficultyLevel}
                        onChange={(e) => setEditedDifficultyLevel(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
                      <input
                        type="text"
                        value={editedEstimatedCost}
                        onChange={(e) => setEditedEstimatedCost(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g. $5,000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Steps to Achieve</label>
                      <div className="space-y-2">
                        {editedSteps.map((step, index) => (
                          <div key={index} className="flex items-center">
                            <input
                              type="text"
                              value={step}
                              onChange={(e) => handleStepChange(index, e.target.value)}
                              className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeStep(index)
                              }}
                              className="ml-2 p-1 text-red-500 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            addStep()
                          }}
                          className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                        >
                          + Add Step
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                        disabled={updateGoalMutation.isPending || updateUserGoalMutation.isPending}
                      >
                        {(updateGoalMutation.isPending || updateUserGoalMutation.isPending) ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">{selectedWish.title}</h2>
                        <p className="text-gray-600">{selectedWish.description}</p>
                      </div>
                      <div className="flex gap-2">
                        {dbUser?.id && selectedWish && (
                          <div className="flex flex-col gap-2">
                            {isFromPersonalGoals ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveFromPersonalGoals(selectedWish)
                                  }}
                                  className="px-3 py-1 text-white rounded hover:opacity-90 transition-colors bg-red-600 hover:bg-red-700 text-sm"
                                >
                                  Remove
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setTaskEditorInitial({
                                      title: selectedWish.title || "",
                                      description: selectedWish.description || "",
                                      image_url: selectedWish.image_url || undefined,
                                      estimated_cost: selectedWish.estimated_cost || undefined,
                                      difficulty_level: selectedWish.difficulty_level || 0,
                                    })
                                    setTaskEditorOpen(true)
                                  }}
                                  className="px-3 py-1 text-white rounded hover:opacity-90 transition-colors bg-green-600 hover:bg-green-700 text-sm"
                                >
                                  Create Task from Wish (+Task)
                                </button>
                              </>
                            ) : (
                              !isGoalInPersonalGoals(selectedWish.id) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAddToPersonalGoals(selectedWish)
                                  }}
                                  className="px-4 py-2 text-white rounded hover:opacity-90 transition-colors bg-purple-600 hover:bg-purple-700"
                                >
                                  Add to Personal Goals
                                </button>
                              )
                            )}
                          </div>
                        )}
                        {isFromPersonalGoals && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit()
                            }}
                            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      {selectedWish.estimated_cost && (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-purple-600" />
                          <span className="font-medium mr-1">Cost:</span>
                          {selectedWish.estimated_cost}
                        </div>
                      )}

                      <div className="flex items-center">
                        <span className="font-medium mr-1">Difficulty:</span>
                        {selectedWish.difficulty_level}
                      </div>
                    </div>

                    {selectedWish.steps && selectedWish.steps.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center">
                          <CheckSquare className="h-4 w-4 mr-2 text-purple-600" />
                          Steps to achieve:
                        </h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {selectedWish.steps.map((step, index) => (
                            <li key={index} className="text-gray-600 text-sm">
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* Add Wish Modal */}
      {isAddWishModalOpen && (
        <Dialog open={isAddWishModalOpen} onOpenChange={setIsAddWishModalOpen}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="relative">
                <button
                  onClick={closeAddWishModal}
                  className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-10"
                >
                  <X className="h-5 w-5" />
                </button>
                <AddWish onSuccess={closeAddWishModal} isModal={true} />
              </div>
            </div>
          </div>
        </Dialog>
      )}
      {taskEditorOpen && (
        <TaskEditor
          open={taskEditorOpen}
          onClose={() => setTaskEditorOpen(false)}
          initial={taskEditorInitial || undefined}
        />
      )}
    </div>
  )
}

export default WishBoard
