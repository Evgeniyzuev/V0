"use client"

import { useState } from "react"
import { ThumbsUp, MessageSquare, Share2, Bookmark, MoreHorizontal } from "lucide-react"

// Sample success stories data
const successStories = [
  {
    id: 1,
    user: {
      name: "David",
      avatar: "/placeholder.svg?height=100&width=100",
      category: "Career",
    },
    title: "Career Pivot Success",
    image: "/placeholder.svg?height=300&width=500",
    content:
      "David, an accountant, dreamt of switching to game development but felt lost. The AI Assistant analyzed his skills, suggested targeted online courses, curated a portfolio-building plan, and flagged relevant entry-level job openings he wouldn't have found. After 8 months of guided effort, David landed his dream junior developer role and is now thrilled to work on projects he's passionate about.",
    likes: 243,
    comments: 42,
  },
  {
    id: 2,
    user: {
      name: "Priya",
      avatar: "/placeholder.svg?height=100&width=100",
      category: "Business",
    },
    title: "Entrepreneurial Launch",
    image: "/placeholder.svg?height=300&width=500",
    content:
      "Priya wanted to launch her sustainable crafts business for years but was overwhelmed by the process. The AI Assistant broke down the steps, helped her research target markets, identified ethical suppliers based on her criteria, generated a basic business plan framework, and even suggested initial marketing strategies. Her online store is now thriving, something she admits she couldn't have navigated alone.",
    likes: 187,
    comments: 34,
  },
  {
    id: 3,
    user: {
      name: "Leo",
      avatar: "/placeholder.svg?height=100&width=100",
      category: "Relationships",
    },
    title: "Finding a Meaningful Relationship",
    image: "/placeholder.svg?height=300&width=500",
    content:
      "Leo struggled with dating apps and social anxiety, longing for a deep connection. The AI Assistant helped him articulate his values and relationship goals, suggested local social clubs aligned with his actual interests (not just dating venues), and offered personalized communication tips for low-pressure interactions. He met his current partner at a hiking group recommended by the AI, forming a bond he'd almost given up on.",
    likes: 325,
    comments: 58,
  },
  {
    id: 4,
    user: {
      name: "Chloe",
      avatar: "/placeholder.svg?height=100&width=100",
      category: "Creativity",
    },
    title: "Overcoming Creative Block",
    image: "/placeholder.svg?height=300&width=500",
    content:
      "Chloe, a writer, faced a six-month creative block that threatened her livelihood. The AI Assistant provided tailored creativity exercises, analyzed her previous successful work patterns, suggested a modified work environment based on productivity research, and helped her develop a sustainable creative routine. She's now completed her novel and secured a publishing deal, crediting the AI's personalized approach for breaking her out of her rut.",
    likes: 156,
    comments: 27,
  },
  {
    id: 5,
    user: {
      name: "Marcus",
      avatar: "/placeholder.svg?height=100&width=100",
      category: "Health",
    },
    title: "Fitness Transformation",
    image: "/placeholder.svg?height=300&width=500",
    content:
      "Marcus had tried and failed at multiple fitness programs, feeling discouraged by one-size-fits-all approaches. The AI Assistant analyzed his previous attempts, identified specific barriers, and created a personalized program accounting for his joint issues, schedule constraints, and food preferences. By focusing on gradual habit building rather than drastic changes, Marcus lost 45 pounds over 10 months and has maintained his new lifestyle for over a year.",
    likes: 412,
    comments: 73,
  },
  {
    id: 6,
    user: {
      name: "Sophia",
      avatar: "/placeholder.svg?height=100&width=100",
      category: "Learning",
    },
    title: "Language Learning Breakthrough",
    image: "/placeholder.svg?height=300&width=500",
    content:
      "Sophia had attempted to learn Japanese multiple times but always abandoned it after a few weeks. The AI Assistant identified her visual learning style, suggested specific immersion techniques fitting her daily routine, and created a personalized spaced repetition schedule. The AI also found a language exchange partner with shared interests in her time zone. After 8 months, she can now watch anime without subtitles and is planning her first trip to Japan.",
    likes: 231,
    comments: 45,
  },
  {
    id: 7,
    user: {
      name: "Jamal",
      avatar: "/placeholder.svg?height=100&width=100",
      category: "Finance",
    },
    title: "Debt-Free Journey",
    image: "/placeholder.svg?height=300&width=500",
    content:
      "Jamal was drowning in $32,000 of credit card debt despite a good income. The AI Assistant analyzed his spending patterns, identified emotional triggers for impulse purchases, and created a personalized debt reduction plan that didn't feel punishing. With the AI's help in negotiating interest rates and prioritizing payments, Jamal became debt-free in 18 months and has now built an emergency fund for the first time in his life.",
    likes: 378,
    comments: 91,
  },
  {
    id: 8,
    user: {
      name: "Elena",
      avatar: "/placeholder.svg?height=100&width=100",
      category: "Wellness",
    },
    title: "Anxiety Management Success",
    image: "/placeholder.svg?height=300&width=500",
    content:
      "Elena had struggled with anxiety for years, with traditional approaches providing limited relief. The AI Assistant helped her identify specific triggers and patterns, suggested evidence-based techniques tailored to her specific anxiety profile, and created a personalized mindfulness program. The AI also recommended relevant research-backed supplements and helped her track their effectiveness. She reports a 70% reduction in panic attacks and improved quality of life.",
    likes: 289,
    comments: 63,
  },
]

export default function RecommendationsFeed() {
  const [stories, setStories] = useState(successStories)
  const [likedStories, setLikedStories] = useState<number[]>([])
  const [savedStories, setSavedStories] = useState<number[]>([])

  const handleLike = (storyId: number) => {
    if (likedStories.includes(storyId)) {
      // Unlike
      setLikedStories(likedStories.filter((id) => id !== storyId))
      setStories(stories.map((story) => (story.id === storyId ? { ...story, likes: story.likes - 1 } : story)))
    } else {
      // Like
      setLikedStories([...likedStories, storyId])
      setStories(stories.map((story) => (story.id === storyId ? { ...story, likes: story.likes + 1 } : story)))
    }
  }

  const handleSave = (storyId: number) => {
    if (savedStories.includes(storyId)) {
      setSavedStories(savedStories.filter((id) => id !== storyId))
    } else {
      setSavedStories([...savedStories, storyId])
    }
  }

  return (
    <div className="bg-white">
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-2">Success Stories</h1>
        <p className="text-gray-600 mb-6">Inspiration from people who achieved their goals</p>
      </div>

      <div className="divide-y">
        {stories.map((story) => (
          <div key={story.id} className="p-4">
            {/* User info */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <img
                  src={story.user.avatar || "/placeholder.svg"}
                  alt={story.user.name}
                  className="w-12 h-12 rounded-full object-cover mr-3"
                />
                <div>
                  <h3 className="font-semibold text-lg">{story.user.name}</h3>
                  <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">
                    {story.user.category}
                  </span>
                </div>
              </div>
              <button className="text-gray-400">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>

            {/* Story title */}
            <h2 className="text-xl font-bold mb-3">{story.title}</h2>

            {/* Story image */}
            <div className="mb-3 rounded-lg overflow-hidden">
              <img src={story.image || "/placeholder.svg"} alt={story.title} className="w-full h-auto" />
            </div>

            {/* Story content */}
            <p className="text-gray-700 mb-4">{story.content}</p>

            {/* Engagement stats */}
            <div className="flex justify-between text-gray-500 text-sm mb-3">
              <span>{story.likes} likes</span>
              <span>{story.comments} comments</span>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between border-t pt-3">
              <button
                className={`flex items-center ${likedStories.includes(story.id) ? "text-purple-600" : "text-gray-500"}`}
                onClick={() => handleLike(story.id)}
              >
                <ThumbsUp className="h-5 w-5 mr-1" />
                <span>Like</span>
              </button>

              <button className="flex items-center text-gray-500">
                <MessageSquare className="h-5 w-5 mr-1" />
                <span>Comment</span>
              </button>

              <button className="flex items-center text-gray-500">
                <Share2 className="h-5 w-5 mr-1" />
                <span>Share</span>
              </button>

              <button
                className={`flex items-center ${savedStories.includes(story.id) ? "text-purple-600" : "text-gray-500"}`}
                onClick={() => handleSave(story.id)}
              >
                <Bookmark className="h-5 w-5 mr-1" />
                <span>Save</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

