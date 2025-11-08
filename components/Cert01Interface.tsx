"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Star, Heart, ThumbsUp, ThumbsDown, Laugh } from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useUser } from "@/components/UserContext"
import { Button } from "@/components/ui/button"
import CardDetailModal from "@/components/CardDetailModal"

const supabase = createClientSupabaseClient()

interface Cert01InterfaceProps {
  isOpen: boolean
  onClose: () => void
}

interface LearningCardData {
  id: number
  wasImage: string
  becameImage: string
  title: string
  description: string
  category: string
  cardOrder: number
  reaction_counts?: Record<string, number>
}

export default function Cert01Interface({ isOpen, onClose }: Cert01InterfaceProps) {
  const { dbUser } = useUser()
  const [selectedCard, setSelectedCard] = useState<LearningCardData | null>(null)
  const [learningCards, setLearningCards] = useState<LearningCardData[]>([])
  const [progress, setProgress] = useState<Record<number, boolean>>({})
  const [ratings, setRatings] = useState<Record<number, number>>({})
  const [userReactions, setUserReactions] = useState<Record<number, Record<string, boolean>>>({})
  const [loading, setLoading] = useState(true)

  // Load certificate cards
  const loadCards = useCallback(async () => {
    try {
      // Load cards for cert01 (only learning cards, not description)
      const { data: cardsData } = await supabase
        .from('certificate_cards')
        .select('*')
        .eq('certificate_code', 'cert01')
        .eq('card_type', 'learning')
        .order('card_order', { ascending: true })

      if (cardsData) {
        const formattedCards: LearningCardData[] = cardsData.map(card => ({
          id: card.id,
          wasImage: card.was_image_url || '/placeholder.svg',
          becameImage: card.became_image_url || '/placeholder.svg',
          title: card.title,
          description: card.description || '',
          category: card.category || '',
          cardOrder: card.card_order,
          reaction_counts: card.reaction_counts || {}
        }))
        setLearningCards(formattedCards)
      }
    } catch (error) {
      console.error('Error loading certificate cards:', error)
    }
  }, [])

  // Load user progress, ratings, and reactions
  const loadUserData = useCallback(async () => {
    if (!dbUser?.id) return

    try {
      setLoading(true)

      // Load all user interactions for cert01 (now consolidated)
      const { data: interactionsData } = await supabase
        .from('user_certificate_interactions')
        .select('card_id, progress, rating, comment, reactions')
        .eq('user_id', dbUser.id)
        .eq('certificate_code', 'cert01')

      const progressMap: Record<number, boolean> = {}
      const ratingsMap: Record<number, number> = {}
      const reactionsMap: Record<number, Record<string, boolean>> = {}

      interactionsData?.forEach(item => {
        if (item.progress === 'completed') {
          progressMap[item.card_id] = true
        }
        if (item.rating) {
          ratingsMap[item.card_id] = item.rating
        }
        if (item.reactions && Array.isArray(item.reactions)) {
          reactionsMap[item.card_id] = {}
          item.reactions.forEach((reaction: string) => {
            reactionsMap[item.card_id][reaction] = true
          })
        }
      })

      setProgress(progressMap)
      setRatings(ratingsMap)
      setUserReactions(reactionsMap)

    } catch (error) {
      console.error('Error loading cert01 data:', error)
    } finally {
      setLoading(false)
    }
  }, [dbUser?.id])

  useEffect(() => {
    if (isOpen) {
      loadCards()
      if (dbUser?.id) {
        loadUserData()
      }
    }
  }, [isOpen, dbUser?.id, loadCards, loadUserData])

  const handleCardClick = async (card: LearningCardData) => {
    setSelectedCard(card)

    // Mark card as viewed if not already viewed
    if (!progress[card.id] && dbUser?.id) {
      try {
        await supabase
          .from('user_certificate_interactions')
          .upsert({
            user_id: dbUser.id,
            certificate_code: 'cert01',
            card_id: card.id,
            progress: 'viewed'
          })
      } catch (error) {
        console.error('Error updating progress:', error)
      }
    }
  }

  const handleRating = async (cardId: number, rating: number) => {
    if (!dbUser?.id) return

    try {
      await supabase
        .from('user_certificate_interactions')
        .upsert({
          user_id: dbUser.id,
          certificate_code: 'cert01',
          card_id: cardId,
          rating: rating
        })

      setRatings(prev => ({ ...prev, [cardId]: rating }))
    } catch (error) {
      console.error('Error saving rating:', error)
    }
  }

  const handleReaction = async (cardId: number, reactionType: string) => {
    if (!dbUser?.id) return

    const hasReacted = userReactions[cardId]?.[reactionType]
    console.log('Handling reaction:', { cardId, reactionType, hasReacted, userId: dbUser.id })

    try {
      // Get current reactions array
      const currentReactions = userReactions[cardId] || {}
      let newReactions: string[]

      if (hasReacted) {
        // Remove reaction from array
        newReactions = Object.keys(currentReactions).filter(r => r !== reactionType)
        console.log('Removing reaction, new array:', newReactions)
      } else {
        // Add reaction to array
        newReactions = [...Object.keys(currentReactions), reactionType]
        console.log('Adding reaction, new array:', newReactions)
      }

      // Upsert the entire row with updated reactions
      const { error } = await supabase
        .from('user_certificate_interactions')
        .upsert({
          user_id: dbUser.id,
          certificate_code: 'cert01',
          card_id: cardId,
          reactions: newReactions
        })

      if (error) {
        console.error('Upsert error:', error)
        throw error
      }

      // Update local state
      setUserReactions(prev => ({
        ...prev,
        [cardId]: {
          ...prev[cardId],
          [reactionType]: !hasReacted
        }
      }))

      // Reload cards to update counts
      await loadCards()
      console.log('Reaction handled successfully')
    } catch (error) {
      console.error('Error handling reaction:', error)
    }
  }

  const handleComplete = async (cardId: number) => {
    if (!dbUser?.id) return

    try {
      await supabase
        .from('user_certificate_interactions')
        .upsert({
          user_id: dbUser.id,
          certificate_code: 'cert01',
          card_id: cardId,
          progress: 'completed'
        })

      setProgress(prev => ({ ...prev, [cardId]: true }))
    } catch (error) {
      console.error('Error marking complete:', error)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Full screen overlay */}
      <div className="fixed inset-0 z-50 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <h1 className="text-xl font-bold">Learning Journey Certificate</h1>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* 2x2 Grid of Cards */}
        <div className="h-[calc(100vh-80px)] p-4">
          <div className="grid grid-cols-2 gap-4 h-full">
            {learningCards.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => handleCardClick(card)}
              >
                {/* Card Images - was on top, became on bottom */}
                <div className="relative h-3/5">
                  {/* WAS image */}
                  <div className="relative h-1/2">
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

                  {/* BECAME image */}
                  <div className="relative h-1/2">
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

                {/* Card Content */}
                <div className="p-3 h-2/5 flex flex-col">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{card.title}</h3>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{card.description}</p>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3].map((star) => (
                      <button
                        key={star}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRating(card.id, star)
                        }}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            star <= (ratings[card.id] || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Reactions - only show if user hasn't reacted */}
                  {!userReactions[card.id] && (
                    <div className="flex items-center gap-1 mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReaction(card.id, 'heart')
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded border hover:bg-gray-50"
                      >
                        <Heart className="h-3 w-3" />
                        <span className="text-xs">{card.reaction_counts?.heart || 0}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReaction(card.id, 'thumbs_up')
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded border hover:bg-gray-50"
                      >
                        <ThumbsUp className="h-3 w-3" />
                        <span className="text-xs">{card.reaction_counts?.thumbs_up || 0}</span>
                      </button>
                    </div>
                  )}

                  {/* Complete Button */}
                  {!progress[card.id] && (
                    <Button
                      size="sm"
                      className="w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleComplete(card.id)
                      }}
                    >
                      Complete
                    </Button>
                  )}

                  {/* Completed Badge */}
                  {progress[card.id] && (
                    <div className="text-center">
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        ✓ Completed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCard}
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        userId={dbUser?.id}
      />
    </>
  )
}
