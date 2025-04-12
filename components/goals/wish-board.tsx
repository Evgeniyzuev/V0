import React, { useState, useRef } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Edit, X, Calendar, DollarSign, CheckSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useUser } from "@/components/UserContext"
import { fetchGoals, fetchUserGoals, updateGoal } from '@/lib/api/goals'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Goal } from '@/types/supabase'
import { toast } from 'sonner'
import GoalUpdater, { GoalUpdaterRef } from './GoalUpdater';

// Example goals data
// const goals = [
//   {
//     id: 1,
//     title: 'Get the First Level',
//     description: 'Advance through the first milestone in your personal development.',
//     imageUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
//     progress: 0,
//     targetDate: "",
//     estimatedCost: "Free",
//     difficulty_level: 0,
//     steps: ["Watch all tutorial videos", "Complete practice exercises", "Pass the level 1 assessment"],
//   },
//   {
//     id: 2,
//     title: 'Travel to Japan',
//     description: 'Visit Tokyo, Kyoto, and Mount Fuji during cherry blossom season.',
//     imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8amFwYW58ZW58MHx8MHx8fDA%3D',
//     progress: 0,
//     targetDate: "Apr 2024",
//     estimatedCost: "$5,000",
//     difficulty_level: 13,
//     steps: [
//       "Save $5,000 for the trip",
//       "Research and book flights",
//       "Plan itinerary for Tokyo, Kyoto, and Osaka",
//       "Learn basic Japanese phrases",
//       "Apply for Japan visa",
//     ],
//   },
//   {
//     id: 3,
//     title: 'Start a Business',
//     description: 'Launch my own startup focused on sustainable products.',
//     imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YnVzaW5lc3N8ZW58MHx8MHx8fDA%3D',
//     progress: 0,
//     targetDate: "Jan 2024",
//     estimatedCost: "$10,000",
//     difficulty_level: 13,
//     steps: [
//       "Develop business plan",
//       "Secure initial funding",
//       "Create prototype products",
//       "Build website and online presence",
//       "Launch marketing campaign",
//     ],
//   },
//   {
//     id: 4,
//     title: 'Run a Marathon',
//     description: 'Train for and complete a full marathon in under 4 hours.',
//     imageUrl: 'https://images.unsplash.com/photo-1461897104016-0b3b00cc81ee?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bWFyYXRob258ZW58MHx8MHx8fDA%3D',
//     progress: 0,
//     targetDate: "Oct 2023",
//     estimatedCost: "$300",
//     difficulty_level: 13,
//     steps: [
//       "Follow 16-week training plan",
//       "Complete a half marathon",
//       "Purchase proper running shoes",
//       "Register for marathon event",
//       "Develop nutrition strategy",
//     ],
//   },
//   {
//     id: 5,
//     title: 'Write a Book',
//     description: 'Complete a novel of at least 50,000 words and publish it.',
//     imageUrl: 'https://images.unsplash.com/photo-1519682577862-22b62b24e493?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Ym9va3xlbnwwfHwwfHx8MA%3D%3D',
//     progress: 0,
//     targetDate: "Dec 2023",
//     estimatedCost: "$2,000",
//     difficulty_level: 15,
//     steps: [
//       "Finish first draft (60,000 words)",
//       "Revise and edit manuscript",
//       "Find beta readers for feedback",
//       "Research literary agents",
//       "Submit to publishers or self-publish",
//     ],
//   },
//   {
//     id: 6,
//     title: 'Learn to Surf',
//     description: 'Take surfing lessons and be able to ride waves confidently.',
//     imageUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3VyZnxlbnwwfHwwfHx8MA%3D%3D',
//     progress: 0,
//     targetDate: "Aug 2023",
//     estimatedCost: "$800",
//     difficulty_level: 16,
//     steps: [
//       "Take beginner surfing lessons",
//       "Purchase surfboard and wetsuit",
//       "Practice paddling and pop-up technique",
//       "Learn to read wave patterns",
//       "Successfully ride 10 waves in a session",
//     ],
//   },
//   {
//     id: 7,
//     title: 'Build a Tiny House',
//     description: 'Design and build a sustainable tiny house on wheels.',
//     imageUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dGlueSUyMGhvdXNlfGVufDB8fDB8fHww',
//     progress: 0,
//     targetDate: "Jun 2025",
//     estimatedCost: "$50,000",
//     difficulty_level: 18,
//     steps: [
//       "Design house plans",
//       "Acquire building permits",
//       "Purchase materials",
//       "Learn construction skills",
//       "Build foundation and frame",
//     ],
//   },
//   {
//     id: 8,
//     title: 'Adopt a Dog',
//     description: 'Adopt a rescue dog and train them to be a therapy animal.',
//     imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8ZG9nfGVufDB8fDB8fHww',
//     progress: 0,
//     targetDate: "Jul 2023",
//     estimatedCost: "$1,000 initial + $100/month",
//     difficulty_level: 3,
//     steps: [
//       "Research dog breeds suitable for my lifestyle",
//       "Dog-proof home and yard",
//       "Purchase supplies (bed, food, toys, etc.)",
//       "Visit local shelters",
//       "Complete adoption process",
//     ],
//   },
//   {
//     id: 9,
//     title: 'Star Gazing Trip',
//     description: 'Visit a dark sky reserve and photograph the Milky Way.',
//     imageUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3RhcnN8ZW58MHx8MHx8fDA%3D',
//     progress: 0,
//     targetDate: "Sep 2023",
//     estimatedCost: "$1,200",
//     difficulty_level: 2,
//     steps: [
//       "Research dark sky reserves",
//       "Purchase telescope and astronomy guide",
//       "Learn to identify major constellations",
//       "Book accommodations near reserve",
//       "Plan observation schedule around moon phases",
//     ],
//   },
//   {
//     id: 10,
//     title: 'Confirm Humanity',
//     description: 'Verify your identity and activate full platform features.',
//     imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
//     progress: 0,
//     targetDate: "Jun 2023",
//     estimatedCost: "Free",
//     difficulty_level: 1,
//     steps: ["Upload identification documents", "Complete verification questionnaire", "Pass the security check"],
//   },
//   {
//     id: 11,
//     title: 'Plan Passive Income',
//     description: 'Create a strategy for building sustainable passive income streams.',
//     imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
//     progress: 0,
//     targetDate: "Dec 2023",
//     estimatedCost: "Varies",
//     difficulty_level: 4,
//     steps: [
//       "Research passive income opportunities",
//       "Select 3 viable income streams",
//       "Create implementation timeline",
//     ],
//   },
//   {
//     id: 12,
//     title: 'Complete 3 Tasks',
//     description: 'Complete three tasks related to your selected goal to build momentum.',
//     imageUrl: 'https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafkreig67kt5udbntrhd3cijejxrz57a4fsegwr6hspcxmokliq6yqtzpi',
//     progress: 0,
//     targetDate: "Jun 2023",
//     estimatedCost: "Free",
//     difficulty_level: 1,
//     steps: [
//       "Complete task #1: Platform orientation",
//       "Complete task #2: Goal setting",
//       "Complete task #3: Community introduction",
//     ],
//   },
//   {
//     id: 13,
//     title: 'Track Progress',
//     description: 'Monitor your progress and celebrate small wins along the way.',
//     imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
//     progress: 0,
//     targetDate: "Ongoing",
//     estimatedCost: "Free",
//     difficulty_level: 1,
//     steps: [
//       "Set up progress tracking dashboard",
//       "Establish weekly review routine",
//       "Create milestone celebration plan",
//     ],
//   },
//   {
//     id: 14,
//     title: 'Learn Piano',
//     description: 'Take piano lessons and learn to play my favorite songs.',
//     imageUrl: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cGlhbm98ZW58MHx8MHx8fDA%3D',
//     progress: 30,
//     targetDate: "Ongoing",
//     estimatedCost: "$1,200/year",
//     difficulty_level: 11,
//     steps: [
//       "Find a piano teacher",
//       "Purchase or rent a keyboard",
//       "Practice 30 minutes daily",
//       "Learn to read sheet music",
//       "Master 5 songs by end of year",
//     ],
//   },
// ];

// Personal goals data
const personalGoals: Goal[] = [
  {
    id: 1,
    created_at: new Date().toISOString(),
    title: 'Get the First Level',
    description: 'Advance through the first milestone in your personal development.',
    image_url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    estimated_cost: "Free",
    difficulty_level: 0,
    steps: ["Watch all tutorial videos", "Complete practice exercises", "Pass the level 1 assessment"]
  },
  {
    id: 2,
    created_at: new Date().toISOString(),
    title: 'Travel to Japan',
    description: 'Visit Tokyo, Kyoto, and Mount Fuji during cherry blossom season.',
    image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8amFwYW58ZW58MHx8MHx8fDA%3D',
    estimated_cost: "$5,000",
    difficulty_level: 13,
    steps: [
      "Save $5,000 for the trip",
      "Research and book flights",
      "Plan itinerary for Tokyo, Kyoto, and Osaka",
      "Learn basic Japanese phrases",
      "Apply for Japan visa"
    ]
  }
];

interface WishBoardProps {
  showOnlyRecommendations: boolean;
}

const WishBoard: React.FC<WishBoardProps> = ({ showOnlyRecommendations }) => {
  const { dbUser } = useUser()
  const queryClient = useQueryClient()
  
  // Fetch goals from the database
  const { data: goals = [], isLoading: isLoadingGoals, error: goalsError } = useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals
  })

  // Fetch user goals from the database, passing the user ID
  const { data: userGoals = [], isLoading: isLoadingUserGoals, error: userGoalsError } = useQuery({
    // Query key теперь включает userId, чтобы запрос перезагружался при смене пользователя
    queryKey: ['user-goals', dbUser?.id], 
    // Передаем userId в функцию запроса
    queryFn: () => fetchUserGoals(dbUser?.id), 
    // Запрос активен только если есть dbUser.id
    enabled: !!dbUser?.id 
  })

  const goalUpdaterRef = useRef<GoalUpdaterRef>(null);
  const goalUpdater = dbUser?.id ? (
    <GoalUpdater 
      ref={goalUpdaterRef} 
      goals={goals} 
    />
  ) : null;

  const [selectedWish, setSelectedWish] = useState<Goal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedSteps, setEditedSteps] = useState<string[]>([]);
  const [editedTargetDate, setEditedTargetDate] = useState('');
  const [editedEstimatedCost, setEditedEstimatedCost] = useState('');
  const [editedProgress, setEditedProgress] = useState(0);
  const [editedDifficultyLevel, setEditedDifficultyLevel] = useState(0);

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Goal> }) => 
      updateGoal(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast.success('Goal updated successfully')
    },
    onError: (error) => {
      console.error('Error updating goal:', error)
      toast.error('Failed to update goal')
    }
  })

  const handleWishClick = (wish: Goal) => {
    setSelectedWish(wish);
    setEditedTitle(wish.title);
    setEditedDescription(wish.description || '');
    setEditedSteps(wish.steps || []);
    setEditedEstimatedCost(wish.estimated_cost || '');
    setEditedDifficultyLevel(wish.difficulty_level || 0);
    setIsEditing(false);
  };

  const closeModal = () => {
    setSelectedWish(null);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!selectedWish) return;

    updateGoalMutation.mutate({
      id: selectedWish.id,
      updates: {
        title: editedTitle,
        description: editedDescription,
        steps: editedSteps,
        estimated_cost: editedEstimatedCost,
        difficulty_level: editedDifficultyLevel,
      }
    })

    setIsEditing(false);
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...editedSteps];
    newSteps[index] = value;
    setEditedSteps(newSteps);
  };

  const addStep = () => {
    setEditedSteps([...editedSteps, '']);
  };

  const removeStep = (index: number) => {
    const newSteps = [...editedSteps];
    newSteps.splice(index, 1);
    setEditedSteps(newSteps);
  };

  const handleAddToPersonalGoals = async (goal: Goal) => {
    if (!dbUser?.id) {
      toast.error('Please log in to add goals')
      return
    }
    if (!goalUpdaterRef.current) {
      toast.error('Goal updater not initialized')
      return
    }
    
    try {
      await goalUpdaterRef.current.addGoalToUserGoals(goal);
      closeModal();
    } catch (error) {
      console.error('Error adding goal:', error)
      toast.error('Failed to add goal: ' + (error as Error).message)
    }
  };

  if (isLoadingGoals || isLoadingUserGoals) {
    return <div className="p-4">Loading goals...</div>;
  }

  if (goalsError || userGoalsError) {
    return <div className="p-4 text-red-500">Error loading goals: {(goalsError || userGoalsError)?.message}</div>;
  }

  return (
    <div className="p-4 space-y-2">
      {goalUpdater}
      {!dbUser?.id ? (
        // Auth UI for unauthenticated users
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
      ) : (
        // Personal Goals Section for authenticated users
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Your Personal Goals</h3>
          <div className="grid grid-cols-3 gap-1">
            {userGoals.map((goal) => (
              <div
                key={goal.id}
                className="image-item animate-fade-in rounded-lg overflow-hidden shadow-md aspect-square cursor-pointer"
                onClick={() => handleWishClick(goal)}
              >
                <div className="relative w-full h-full">
                  <img
                    src={goal.image_url || ''}
                    alt={goal.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <div className="p-3 text-white">
                      <div className="text-sm font-medium">{goal.title}</div>
                      {goal.status && (
                        <div className="text-xs mt-1">Status: {goal.status}</div>
                      )}
                      {goal.progress_percentage !== null && (
                        <div className="text-xs">Progress: {goal.progress_percentage}%</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-2">Available Goals</h3>
        <div className="grid grid-cols-3 gap-1">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="image-item animate-fade-in rounded-lg overflow-hidden shadow-md aspect-square cursor-pointer"
              onClick={() => handleWishClick(goal)}
            >
              <div className="relative w-full h-full">
                <img
                  src={goal.image_url || ''}
                  alt={goal.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-3 text-white">
                    <div className="text-sm font-medium">{goal.title}</div>
                    <div className="text-xs mt-1">Difficulty: {goal.difficulty_level}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goal Detail Modal */}
      {selectedWish && (
        <Dialog open={!!selectedWish} onOpenChange={() => closeModal()}>
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="relative">
                <img
                  src={selectedWish.image_url || ''}
                  alt={selectedWish.title}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Difficulty Level
                      </label>
                      <input
                        type="number"
                        value={editedDifficultyLevel}
                        onChange={(e) => setEditedDifficultyLevel(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Cost
                      </label>
                      <input
                        type="text"
                        value={editedEstimatedCost}
                        onChange={(e) => setEditedEstimatedCost(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g. $5,000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Steps to Achieve
                      </label>
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
                                e.stopPropagation();
                                removeStep(index);
                              }}
                              className="ml-2 p-1 text-red-500 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addStep();
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
                        disabled={updateGoalMutation.isPending}
                      >
                        {updateGoalMutation.isPending ? 'Saving...' : 'Save'}
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
                        {dbUser?.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToPersonalGoals(selectedWish);
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                          >
                            Add to Personal Goals
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit();
                          }}
                          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
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
                            <li key={index} className="text-gray-600 text-sm">{step}</li>
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
    </div>
  );
};

export default WishBoard;
