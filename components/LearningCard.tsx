"use client"

import { useState } from "react"
import { Star, CheckCircle, MessageCircle, Heart, ThumbsUp, ThumbsDown, Laugh } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface LearningCardData {
  id: number
  wasImage: string
  becameImage: string
  title: string
  description: string
  category: string
}

interface LearningCardProps {
  card: LearningCardData
  isCompleted: boolean
  rating: number
  onClick: () => void
  onRate: (rating: number) => void
  onComplete: () => void
}

export default function LearningCard({
  card,
  isCompleted,
  rating,
  onClick,
  onRate,
  onComplete
}: LearningCardProps) {
  const [showRating, setShowRating] = useState(false)

  const handleRatingClick = (newRating: number) => {
    onRate(newRating)
    setShowRating(false)
  }

  return (
    <Card className="w-full h-full cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardContent className="p-0 h-full flex flex-col">
        {/* Images section - Before/After */}
        <div className="relative flex-1 bg-gray-100">
          <div className="grid grid-cols-2 h-full">
            {/* "Was" image */}
            <div className="relative">
              <img
                src={card.wasImage}
                alt="Before"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg"
                }}
              />
              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                WAS
              </div>
            </div>

            {/* "Became" image */}
            <div className="relative">
              <img
                src={card.becameImage}
                alt="After"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg"
                }}
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                BECAME
              </div>
            </div>
          </div>

          {/* Completion overlay */}
          {isCompleted && (
            <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
              <CheckCircle className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Content section */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                {card.category}
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{card.title}</h3>
            <p className="text-gray-600 text-sm line-clamp-3">{card.description}</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              {!showRating ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowRating(true)
                  }}
                  className="flex items-center gap-1"
                >
                  <Star className="h-3 w-3" />
                  Rate
                </Button>
              ) : (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {[1, 2, 3].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRatingClick(star)}
                      className={`p-1 rounded ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    >
                      <Star className={`h-4 w-4 ${star <= rating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              )}

              {!isCompleted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onComplete()
                  }}
                  className="flex items-center gap-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  Complete
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onClick()
              }}
              className="flex items-center gap-1 text-gray-500"
            >
              <MessageCircle className="h-3 w-3" />
              Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
