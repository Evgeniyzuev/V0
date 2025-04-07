import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Edit, X, Calendar, DollarSign, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

// Example wishes data
const wishes = [
  {
    id: 1,
    title: 'Travel to Japan',
    description: 'Visit Tokyo, Kyoto, and Mount Fuji during cherry blossom season.',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8amFwYW58ZW58MHx8MHx8fDA%3D',
    progress: 45,
    targetDate: "Apr 2024",
    estimatedCost: "$5,000",
    steps: [
      "Save $5,000 for the trip",
      "Research and book flights",
      "Plan itinerary for Tokyo, Kyoto, and Osaka",
      "Learn basic Japanese phrases",
      "Apply for Japan visa",
    ],
  },
  {
    id: 2,
    title: 'Learn Piano',
    description: 'Take piano lessons and learn to play my favorite songs.',
    imageUrl: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cGlhbm98ZW58MHx8MHx8fDA%3D',
    progress: 30,
    targetDate: "Ongoing",
    estimatedCost: "$1,200/year",
    steps: [
      "Find a piano teacher",
      "Purchase or rent a keyboard",
      "Practice 30 minutes daily",
      "Learn to read sheet music",
      "Master 5 songs by end of year",
    ],
  },
  {
    id: 3,
    title: 'Start a Business',
    description: 'Launch my own startup focused on sustainable products.',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YnVzaW5lc3N8ZW58MHx8MHx8fDA%3D',
    progress: 15,
    targetDate: "Jan 2024",
    estimatedCost: "$10,000",
    steps: [
      "Develop business plan",
      "Secure initial funding",
      "Create prototype products",
      "Build website and online presence",
      "Launch marketing campaign",
    ],
  },
  {
    id: 4,
    title: 'Run a Marathon',
    description: 'Train for and complete a full marathon in under 4 hours.',
    imageUrl: 'https://images.unsplash.com/photo-1461897104016-0b3b00cc81ee?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bWFyYXRob258ZW58MHx8MHx8fDA%3D',
    progress: 20,
    targetDate: "Oct 2023",
    estimatedCost: "$300",
    steps: [
      "Follow 16-week training plan",
      "Complete a half marathon",
      "Purchase proper running shoes",
      "Register for marathon event",
      "Develop nutrition strategy",
    ],
  },
  {
    id: 5,
    title: 'Write a Book',
    description: 'Complete a novel of at least 50,000 words and publish it.',
    imageUrl: 'https://images.unsplash.com/photo-1519682577862-22b62b24e493?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Ym9va3xlbnwwfHwwfHx8MA%3D%3D',
    progress: 60,
    targetDate: "Dec 2023",
    estimatedCost: "$2,000",
    steps: [
      "Finish first draft (60,000 words)",
      "Revise and edit manuscript",
      "Find beta readers for feedback",
      "Research literary agents",
      "Submit to publishers or self-publish",
    ],
  },
  {
    id: 6,
    title: 'Learn to Surf',
    description: 'Take surfing lessons and be able to ride waves confidently.',
    imageUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3VyZnxlbnwwfHwwfHx8MA%3D%3D',
    progress: 10,
    targetDate: "Aug 2023",
    estimatedCost: "$800",
    steps: [
      "Take beginner surfing lessons",
      "Purchase surfboard and wetsuit",
      "Practice paddling and pop-up technique",
      "Learn to read wave patterns",
      "Successfully ride 10 waves in a session",
    ],
  },
  {
    id: 7,
    title: 'Build a Tiny House',
    description: 'Design and build a sustainable tiny house on wheels.',
    imageUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dGlueSUyMGhvdXNlfGVufDB8fDB8fHww',
    progress: 25,
    targetDate: "Jun 2025",
    estimatedCost: "$50,000",
    steps: [
      "Design house plans",
      "Acquire building permits",
      "Purchase materials",
      "Learn construction skills",
      "Build foundation and frame",
    ],
  },
  {
    id: 8,
    title: 'Adopt a Dog',
    description: 'Adopt a rescue dog and train them to be a therapy animal.',
    imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8ZG9nfGVufDB8fDB8fHww',
    progress: 50,
    targetDate: "Jul 2023",
    estimatedCost: "$1,000 initial + $100/month",
    steps: [
      "Research dog breeds suitable for my lifestyle",
      "Dog-proof home and yard",
      "Purchase supplies (bed, food, toys, etc.)",
      "Visit local shelters",
      "Complete adoption process",
    ],
  },
  {
    id: 9,
    title: 'Star Gazing Trip',
    description: 'Visit a dark sky reserve and photograph the Milky Way.',
    imageUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3RhcnN8ZW58MHx8MHx8fDA%3D',
    progress: 15,
    targetDate: "Sep 2023",
    estimatedCost: "$1,200",
    steps: [
      "Research dark sky reserves",
      "Purchase telescope and astronomy guide",
      "Learn to identify major constellations",
      "Book accommodations near reserve",
      "Plan observation schedule around moon phases",
    ],
  },
];

// Updated personal goals data with new image for "Complete 3 Tasks"
const personalGoals = [
  {
    id: 101,
    title: 'Get First Level',
    description: 'Complete the initial achievement to unlock your journey.',
    imageUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    progress: 25,
    targetDate: "Aug 2023",
    estimatedCost: "Free",
    steps: [
      "Complete the beginner investment course",
      "Set up a brokerage account",
      "Make your first investment of $100",
    ],
  },
  {
    id: 102,
    title: 'Get the First Level',
    description: 'Advance through the first milestone in your personal development.',
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    progress: 40,
    targetDate: "Jul 2023",
    estimatedCost: "Free",
    steps: ["Watch all tutorial videos", "Complete practice exercises", "Pass the level 1 assessment"],
  },
  {
    id: 103,
    title: 'Confirm Humanity',
    description: 'Verify your identity and activate full platform features.',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    progress: 80,
    targetDate: "Jun 2023",
    estimatedCost: "Free",
    steps: ["Upload identification documents", "Complete verification questionnaire", "Pass the security check"],
  },
  {
    id: 104,
    title: 'Plan Passive Income',
    description: 'Create a strategy for building sustainable passive income streams.',
    imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    progress: 15,
    targetDate: "Dec 2023",
    estimatedCost: "Varies",
    steps: [
      "Research passive income opportunities",
      "Select 3 viable income streams",
      "Create implementation timeline",
    ],
  },
  {
    id: 105,
    title: 'Complete 3 Tasks',
    description: 'Complete three tasks related to your selected goal to build momentum.',
    imageUrl: 'https://blush-keen-constrictor-906.mypinata.cloud/ipfs/bafkreig67kt5udbntrhd3cijejxrz57a4fsegwr6hspcxmokliq6yqtzpi',
    progress: 66,
    targetDate: "Jun 2023",
    estimatedCost: "Free",
    steps: [
      "Complete task #1: Platform orientation",
      "Complete task #2: Goal setting",
      "Complete task #3: Community introduction",
    ],
  },
  {
    id: 106,
    title: 'Track Progress',
    description: 'Monitor your progress and celebrate small wins along the way.',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    progress: 50,
    targetDate: "Ongoing",
    estimatedCost: "Free",
    steps: [
      "Set up progress tracking dashboard",
      "Establish weekly review routine",
      "Create milestone celebration plan",
    ],
  },
];

const WishBoard: React.FC = () => {
  const [selectedWish, setSelectedWish] = useState<typeof wishes[0] | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedSteps, setEditedSteps] = useState<string[]>([]);
  const [editedTargetDate, setEditedTargetDate] = useState('');
  const [editedEstimatedCost, setEditedEstimatedCost] = useState('');
  const [editedProgress, setEditedProgress] = useState(0);

  const handleWishClick = (wish: typeof wishes[0]) => {
    setSelectedWish(wish);
    setEditedTitle(wish.title);
    setEditedDescription(wish.description);
    setEditedSteps(wish.steps || []);
    setEditedTargetDate(wish.targetDate || '');
    setEditedEstimatedCost(wish.estimatedCost || '');
    setEditedProgress(wish.progress || 0);
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
    setIsEditing(false);
    if (selectedWish) {
      selectedWish.title = editedTitle;
      selectedWish.description = editedDescription;
      selectedWish.steps = editedSteps;
      selectedWish.targetDate = editedTargetDate;
      selectedWish.estimatedCost = editedEstimatedCost;
      selectedWish.progress = editedProgress;
    }
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

  return (
    <div className="animate-fade-in space-y-6">
      {/* Personal Goals Section */}
      <div className="mb-6">
        <div className="image-grid grid grid-cols-3 gap-1">
          {personalGoals.map((goal) => (
            <div 
              key={goal.id} 
              className="image-item animate-fade-in rounded-lg overflow-hidden shadow-md aspect-square" 
              onClick={() => handleWishClick(goal)}
            >
              <div className="relative w-full h-full">
                <img 
                  src={goal.imageUrl} 
                  alt={goal.title} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-100 flex items-end">
                  <div className="p-3 text-white text-lg font-medium">
                    {goal.title}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Separator */}
      <Separator className="my-8 h-[2px] bg-app-accent/30" />

      {/* Recommendations Section */}
      <div>
        <div className="image-grid grid grid-cols-3 gap-1">
          {wishes.map((wish) => (
            <div 
              key={wish.id} 
              className="image-item animate-fade-in rounded-lg overflow-hidden shadow-md aspect-square" 
              onClick={() => handleWishClick(wish)}
            >
              <div className="relative w-full h-full">
                <img 
                  src={wish.imageUrl} 
                  alt={wish.title} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-3 text-white text-sm font-medium">
                    {wish.title}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wish Detail Modal */}
      {selectedWish && (
        <div className="modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="modal-content bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <img 
                src={selectedWish.imageUrl} 
                alt={selectedWish.title} 
                className="w-full h-56 object-cover"
              />
              <button 
                className="absolute top-3 right-3 p-1 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
                onClick={closeModal}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-app-accent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-app-accent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Progress (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editedProgress}
                      onChange={(e) => setEditedProgress(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-app-accent"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Date
                      </label>
                      <input
                        type="text"
                        value={editedTargetDate}
                        onChange={(e) => setEditedTargetDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-app-accent"
                        placeholder="e.g. Dec 2023"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-app-accent"
                        placeholder="e.g. $5,000"
                      />
                    </div>
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
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-app-accent"
                          />
                          <button
                            onClick={() => removeStep(index)}
                            className="ml-2 p-1 text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addStep}
                        className="text-sm text-app-accent hover:text-app-accent/80 font-medium"
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
                      className="px-4 py-2 text-sm font-medium text-white bg-app-accent rounded-md hover:bg-app-accent/90 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold">{selectedWish.title}</h3>
                    <button 
                      onClick={handleEdit}
                      className="p-2 text-gray-500 hover:text-app-accent transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                  </div>
                  
                  {selectedWish.progress !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{selectedWish.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-app-accent h-2.5 rounded-full" 
                          style={{ width: `${selectedWish.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-gray-600">{selectedWish.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    {selectedWish.targetDate && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-app-accent" />
                        <span className="font-medium mr-1">Target:</span>
                        {selectedWish.targetDate}
                      </div>
                    )}
                    
                    {selectedWish.estimatedCost && (
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-app-accent" />
                        <span className="font-medium mr-1">Cost:</span>
                        {selectedWish.estimatedCost}
                      </div>
                    )}
                  </div>
                  
                  {selectedWish.steps && selectedWish.steps.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        <CheckSquare className="h-4 w-4 mr-2 text-app-accent" />
                        Steps to achieve:
                      </h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {selectedWish.steps.map((step, index) => (
                          <li key={index} className="text-gray-600 text-sm">{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishBoard;
