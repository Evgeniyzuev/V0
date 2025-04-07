"use client"

import { useState } from "react"
import WishItem from "@/components/goals/wish-item"
import FeaturedWishItem from "@/components/goals/featured-wish-item"
import WishEditModal from "@/components/goals/wish-edit-modal"
import WishDetailModal from "@/components/goals/wish-detail-modal"

// Sample featured wishes (with text overlay)
const featuredWishes = [
  {
    id: 101,
    imageUrl: "/images/presentation.png",
    title: "Get First Level",
    description:
      "Begin your journey to financial independence by completing the introductory courses and establishing your initial investment portfolio.",
    progress: 25,
    targetDate: "Aug 2023",
    steps: [
      "Complete the beginner investment course",
      "Set up a brokerage account",
      "Make your first investment of $100",
    ],
  },
  {
    id: 102,
    imageUrl: "/images/presentation.png",
    title: "Get the First Level",
    description:
      "Master the fundamentals of our platform by completing all beginner tutorials and passing the initial assessment.",
    progress: 40,
    targetDate: "Jul 2023",
    steps: ["Watch all tutorial videos", "Complete practice exercises", "Pass the level 1 assessment"],
  },
  {
    id: 103,
    imageUrl: "/images/presentation.png",
    title: "Confirm Humanity",
    description: "Verify your identity to unlock full platform features and ensure security for all community members.",
    progress: 80,
    targetDate: "Jun 2023",
    steps: ["Upload identification documents", "Complete verification questionnaire", "Pass the security check"],
  },
  {
    id: 104,
    imageUrl: "/images/runners.png",
    title: "Plan Passive Income",
    description:
      "Develop a comprehensive strategy for generating consistent passive income through multiple revenue streams.",
    progress: 15,
    targetDate: "Dec 2023",
    steps: [
      "Research passive income opportunities",
      "Select 3 viable income streams",
      "Create implementation timeline",
    ],
  },
  {
    id: 105,
    imageUrl: "/images/checklist.png",
    title: "Complete 3 Tasks",
    description:
      "Finish your first three assignments to demonstrate commitment and establish momentum in your journey.",
    progress: 66,
    targetDate: "Jun 2023",
    steps: [
      "Complete task #1: Platform orientation",
      "Complete task #2: Goal setting",
      "Complete task #3: Community introduction",
    ],
  },
  {
    id: 106,
    imageUrl: "/images/presentation.png",
    title: "Track Progress",
    description: "Implement a system to monitor your advancement toward goals and identify areas for improvement.",
    progress: 50,
    targetDate: "Jul 2023",
    steps: [
      "Set up progress tracking dashboard",
      "Establish weekly review routine",
      "Create milestone celebration plan",
    ],
  },
]

// Sample regular wishes (Instagram-style)
const sampleWishes = [
  {
    id: 1,
    imageUrl: "/images/japan-street.png",
    title: "Travel to Japan",
    description:
      "Experience the rich culture and beautiful landscapes of Japan, including Tokyo, Kyoto, and Mount Fuji.",
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
    imageUrl: "/images/reading.png",
    title: "Learn Piano",
    description: "Master playing the piano by taking regular lessons and practicing daily to play my favorite songs.",
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
    imageUrl: "/images/runners.png",
    title: "Run a Marathon",
    description: "Train progressively to build endurance and complete a full 26.2-mile marathon.",
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
    id: 4,
    imageUrl: "/images/presentation.png",
    title: "Start a Business",
    description: "Launch my own startup focused on sustainable products that help reduce plastic waste.",
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
    id: 5,
    imageUrl: "/images/reading.png",
    title: "Write a Book",
    description: "Complete my novel manuscript and navigate the publishing process to see my book in print.",
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
    imageUrl: "/images/reading.png",
    title: "Learn to Cook",
    description: "Develop culinary skills to confidently prepare diverse, healthy meals from scratch.",
    progress: 35,
    targetDate: "Ongoing",
    estimatedCost: "$500",
    steps: [
      "Take cooking fundamentals course",
      "Master 10 essential recipes",
      "Learn knife skills and techniques",
      "Experiment with international cuisines",
      "Host dinner party to showcase skills",
    ],
  },
  {
    id: 7,
    imageUrl: "/images/red-house.png",
    title: "Buy a House",
    description: "Save for a down payment and purchase my first home in a neighborhood I love.",
    progress: 25,
    targetDate: "Jun 2025",
    estimatedCost: "$50,000 down payment",
    steps: [
      "Save $50,000 for down payment",
      "Improve credit score to 750+",
      "Get pre-approved for mortgage",
      "Research neighborhoods",
      "Work with realtor to find perfect home",
    ],
  },
  {
    id: 8,
    imageUrl: "/images/reading.png",
    title: "Learn Spanish",
    description: "Become conversationally fluent in Spanish to enhance travel experiences and career opportunities.",
    progress: 40,
    targetDate: "Dec 2023",
    estimatedCost: "$600",
    steps: [
      "Complete Spanish language app course",
      "Practice with language exchange partner weekly",
      "Watch Spanish TV shows with subtitles",
      "Learn 2,000 most common words",
      "Take immersion trip to Spanish-speaking country",
    ],
  },
  {
    id: 9,
    imageUrl: "/images/surfer.png",
    title: "Learn Surfing",
    description: "Master the basics of surfing and confidently ride waves at different beaches.",
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
    id: 10,
    imageUrl: "/images/dog.png",
    title: "Adopt a Dog",
    description: "Prepare my home and lifestyle to welcome a rescue dog as a new family member.",
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
    id: 11,
    imageUrl: "/images/night-sky.png",
    title: "Stargaze in Dark Sky Reserve",
    description: "Visit an international dark sky reserve to observe celestial objects without light pollution.",
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
  {
    id: 12,
    imageUrl: "/images/presentation.png",
    title: "Give a TED Talk",
    description:
      "Develop expertise and public speaking skills to deliver an impactful TED Talk on a topic I'm passionate about.",
    progress: 5,
    targetDate: "Jun 2024",
    estimatedCost: "$2,000",
    steps: [
      "Develop unique perspective on chosen topic",
      "Create compelling presentation",
      "Practice public speaking regularly",
      "Apply to local TEDx events",
      "Refine talk based on feedback",
    ],
  },
]

export default function WishBoard() {
  const [wishes, setWishes] = useState(sampleWishes)
  const [featured, setFeatured] = useState(featuredWishes)
  const [selectedWish, setSelectedWish] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const handleWishClick = (wish: any) => {
    setSelectedWish(wish)
    setIsDetailModalOpen(true)
  }

  const handleEditWish = () => {
    setIsDetailModalOpen(false)
    setIsModalOpen(true)
  }

  const handleWishUpdate = (updatedWish: any) => {
    // Update either featured or regular wishes
    if (updatedWish.id > 100) {
      setFeatured(featured.map((wish) => (wish.id === updatedWish.id ? updatedWish : wish)))
    } else {
      setWishes(wishes.map((wish) => (wish.id === updatedWish.id ? updatedWish : wish)))
    }
    setIsModalOpen(false)
  }

  return (
    <div className="flex flex-col">
      {/* Featured items with text overlay */}
      <div className="grid grid-cols-3 gap-1 p-1">
        {featured.map((wish) => (
          <FeaturedWishItem key={wish.id} wish={wish} onClick={() => handleWishClick(wish)} />
        ))}
      </div>

      {/* Instagram-style grid */}
      <div className="grid grid-cols-3 gap-[2px] mt-2">
        {wishes.map((wish) => (
          <WishItem key={wish.id} wish={wish} onClick={() => handleWishClick(wish)} />
        ))}
      </div>

      {/* Detail Modal */}
      {selectedWish && (
        <WishDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          wish={selectedWish}
          onEdit={handleEditWish}
        />
      )}

      {/* Edit Modal */}
      {selectedWish && (
        <WishEditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          wish={selectedWish}
          onUpdate={handleWishUpdate}
        />
      )}
    </div>
  )
}

