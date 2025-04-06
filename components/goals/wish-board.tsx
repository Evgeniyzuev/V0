"use client"

import { useState } from "react"
import WishItem from "@/components/goals/wish-item"
import FeaturedWishItem from "@/components/goals/featured-wish-item"
import WishEditModal from "@/components/goals/wish-edit-modal"

// Sample featured wishes (with text overlay)
const featuredWishes = [
  {
    id: 101,
    imageUrl: "/placeholder.svg?height=300&width=300",
    title: "Get First Level",
    description: "Begin your journey to financial independence",
  },
  {
    id: 102,
    imageUrl: "/placeholder.svg?height=300&width=300",
    title: "Get the First Level",
    description: "Complete beginner tutorials and guides",
  },
  {
    id: 103,
    imageUrl: "/placeholder.svg?height=300&width=300",
    title: "Confirm Humanity",
    description: "Verify your identity and get started",
  },
  {
    id: 104,
    imageUrl: "/placeholder.svg?height=300&width=300",
    title: "Plan Passive Income",
    description: "Start building your passive income streams",
  },
  {
    id: 105,
    imageUrl: "/placeholder.svg?height=300&width=300",
    title: "Complete 3 Tasks",
    description: "Finish your first three assignments",
  },
  {
    id: 106,
    imageUrl: "/placeholder.svg?height=300&width=300",
    title: "Track Progress",
    description: "Monitor your journey and achievements",
  },
]

// Sample regular wishes (Instagram-style)
const sampleWishes = [
  {
    id: 1,
    imageUrl: "/placeholder.svg?height=300&width=300",
    title: "Travel to Japan",
    description: "Visit Tokyo, Kyoto, and Mount Fuji",
  },
  {
    id: 2,
    imageUrl: "/placeholder.svg?height=300&width=300",
    title: "Learn Piano",
    description: "Take piano lessons and learn to play my favorite songs",
  },
  {
    id: 3,
    imageUrl: "/placeholder.svg?height=300&width=300",
    title: "Run a Marathon",
    description: "Train for and complete a full marathon",
  },
  {
    id: 4,
    imageUrl: "/placeholder.svg?height=300&width=300",
    title: "Start a Business",
    description: "Launch my own startup focused on sustainability",
  },
  {
    id: 5,
    imageUrl: "/placeholder.svg?height=300&width=300",
    title: "Write a Book",
    description: "Complete my novel manuscript and get it published",
  },
  {
    id: 6,
    imageUrl: "/placeholder.svg?height=300&width=300",
    title: "Learn to Cook",
    description: "Master cooking techniques and signature dishes",
  },
  {
    id: 7,
    imageUrl: "/placeholder.svg?height=300&width=300",
    title: "Buy a House",
    description: "Save for and purchase my first home",
  },
  {
    id: 8,
    imageUrl: "/placeholder.svg?height=300&width=300",
    title: "Learn Spanish",
    description: "Become conversationally fluent in Spanish",
  },
  {
    id: 9,
    imageUrl: "/placeholder.svg?height=300&width=300",
    title: "Skydiving",
    description: "Experience the thrill of skydiving at least once",
  },
]

export default function WishBoard() {
  const [wishes, setWishes] = useState(sampleWishes)
  const [featured, setFeatured] = useState(featuredWishes)
  const [selectedWish, setSelectedWish] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleWishClick = (wish: any) => {
    setSelectedWish(wish)
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

