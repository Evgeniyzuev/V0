"use client"

import { useState, useEffect, useCallback } from "react"
import { X, ChevronUp, ChevronDown, Star, MessageCircle, Heart, ThumbsUp, ThumbsDown, Laugh } from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useUser } from "@/components/UserContext"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import LearningCard from "@/components/LearningCard"
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
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [selectedCard, setSelectedCard] = useState<LearningCardData | null>(null)
  const [learningCards, setLearningCards] = useState<LearningCardData[]>([])
  const [progress, setProgress] = useState<Record<number, boolean>>({})
  const [ratings, setRatings] = useState<Record<number, number>>({})
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
          cardOrder: card.card_order
        }))
        setLearningCards(formattedCards)
      }
    } catch (error) {
      console.error('Error loading certificate cards:', error)
    }
  }, [])

  // Load user progress and ratings
  const loadUserData = useCallback(async () => {
    if (!dbUser?.id) return

    try {
      setLoading(true)

      // Load all user interactions for cert01
      const { data: interactionsData } = await supabase
        .from('user_certificate_interactions')
        .select('card_id, interaction_type, content')
        .eq('user_id', dbUser.id)
        .eq('certificate_code', 'cert01')

      const progressMap: Record<number, boolean> = {}
      const ratingsMap: Record<number, number> = {}

      interactionsData?.forEach(item => {
        if (item.interaction_type === 'progress' && item.content === 'completed') {
          progressMap[item.card_id] = true
        } else if (item.interaction_type === 'rating') {
          ratingsMap[item.card_id] = parseInt(item.content || '0')
        }
      })

      setProgress(progressMap)
      setRatings(ratingsMap)

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
    if (!progress[card.id]) {
      try {
        await supabase
          .from('user_certificate_interactions')
          .upsert({
            user_id: dbUser?.id,
            certificate_code: 'cert01',
            card_id: card.id,
            interaction_type: 'progress',
            content: 'viewed'
          })
      } catch (error) {
        console.error('Error updating progress:', error)
      }
    }
  }

  const handleRating = async (cardId: number, rating: number) => {
    try {
      await supabase
        .from('user_certificate_interactions')
        .upsert({
          user_id: dbUser?.id,
          certificate_code: 'cert01',
          card_id: cardId,
          interaction_type: 'rating',
          content: rating.toString()
        })

      setRatings(prev => ({ ...prev, [cardId]: rating }))
    } catch (error) {
      console.error('Error saving rating:', error)
    }
  }

  const handleComplete = async (cardId: number) => {
    try {
      await supabase
        .from('user_certificate_interactions')
        .upsert({
          user_id: dbUser?.id,
          certificate_code: 'cert01',
          card_id: cardId,
          interaction_type: 'progress',
          content: 'completed'
        })

      setProgress(prev => ({ ...prev, [cardId]: true }))
    } catch (error) {
      console.error('Error marking complete:', error)
    }
  }

  const nextCard = () => {
    setCurrentCardIndex((prev) => (prev + 1) % learningCards.length)
  }

  const prevCard = () => {
    setCurrentCardIndex((prev) => (prev - 1 + learningCards.length) % learningCards.length)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Learning Journey</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="px-4 py-2 bg-gray-50">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Card {currentCardIndex + 1} of {learningCards.length}</span>
              <div className="flex gap-1">
                {learningCards.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentCardIndex ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Card content */}
          <div className="relative overflow-hidden" style={{ height: '60vh' }}>
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateY(-${currentCardIndex * 100}%)`,
                height: `${learningCards.length * 100}%`
              }}
            >
              {learningCards.map((card) => (
                <div key={card.id} className="w-full flex-shrink-0 p-4">
                  <LearningCard
                    card={card}
                    isCompleted={progress[card.id] || false}
                    rating={ratings[card.id] || 0}
                    onClick={() => handleCardClick(card)}
                    onRate={(rating: number) => handleRating(card.id, rating)}
                    onComplete={() => handleComplete(card.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center p-4 border-t bg-gray-50">
            <Button
              variant="outline"
              onClick={prevCard}
              disabled={currentCardIndex === 0}
            >
              <ChevronUp className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="text-sm text-gray-500">
              Swipe or use buttons to navigate
            </div>

            <Button
              variant="outline"
              onClick={nextCard}
              disabled={currentCardIndex === learningCards.length - 1}
            >
              Next
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
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
