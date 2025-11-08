"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Send, Heart, ThumbsUp, ThumbsDown, Laugh, MessageCircle, Star } from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const supabase = createClientSupabaseClient()

interface LearningCardData {
  id: number
  wasImage: string
  becameImage: string
  title: string
  description: string
  category: string
  reaction_counts?: Record<string, number>
}

interface Comment {
  id: number
  comment_text: string
  created_at: string
  user_id: string
  reactions: Reaction[]
}

interface Reaction {
  id: number
  reaction_type: string
  user_id: string
  target_id: number
}

interface CardDetailModalProps {
  card: LearningCardData | null
  isOpen: boolean
  onClose: () => void
  userId?: string
}

const REACTION_EMOJIS = {
  'heart': '❤️',
  'thumbs_up': '👍',
  'thumbs_down': '👎',
  'laugh': '😂'
}

const REACTION_ICONS = {
  'heart': Heart,
  'thumbs_up': ThumbsUp,
  'thumbs_down': ThumbsDown,
  'laugh': Laugh
}

export default function CardDetailModal({ card, isOpen, onClose, userId }: CardDetailModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Load comments and reactions for the card
  const loadComments = useCallback(async () => {
    if (!card || !userId) return

    try {
      setLoading(true)

      // Load all interactions for this card
      const { data: interactionsData } = await supabase
        .from('user_certificate_interactions')
        .select('*')
        .eq('certificate_code', 'cert01')
        .eq('card_id', card.id)
        .order('created_at', { ascending: false })

      if (interactionsData) {
        // Separate comments and reactions
        const comments = interactionsData
          .filter(interaction => interaction.interaction_type === 'comment')
          .map(comment => ({
            id: comment.id,
            comment_text: comment.content,
            created_at: comment.created_at,
            user_id: comment.user_id,
            reactions: [] as Reaction[]
          }))

        // Load reactions for each comment
        const commentsWithReactions = await Promise.all(
          comments.map(async (comment) => {
            const { data: reactions } = await supabase
              .from('user_certificate_interactions')
              .select('id, content, user_id, target_id')
              .eq('certificate_code', 'cert01')
              .eq('interaction_type', 'reaction')
              .eq('target_type', 'comment')
              .eq('target_id', comment.id)

            const formattedReactions: Reaction[] = (reactions || []).map(reaction => ({
              id: reaction.id,
              reaction_type: reaction.content,
              user_id: reaction.user_id,
              target_id: reaction.target_id
            }))

            return {
              ...comment,
              reactions: formattedReactions
            }
          })
        )

        setComments(commentsWithReactions)
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoading(false)
    }
  }, [card, userId])

  useEffect(() => {
    if (isOpen && card) {
      loadComments()
    }
  }, [isOpen, card, loadComments])

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !card || !userId) return

    try {
      setSubmitting(true)

      const { data, error } = await supabase
        .from('user_certificate_interactions')
        .insert({
          user_id: userId,
          certificate_code: 'cert01',
          card_id: card.id,
          interaction_type: 'comment',
          content: newComment.trim()
        })
        .select()
        .single()

      if (error) throw error

      // Add the new comment to the list
      setComments(prev => [{
        id: data.id,
        comment_text: data.content,
        created_at: data.created_at,
        user_id: data.user_id,
        reactions: []
      }, ...prev])

      setNewComment("")
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReaction = async (targetType: 'card' | 'comment', targetId: number, reactionType: string) => {
    if (!userId) return

    try {
      // Check if reaction already exists
      const { data: existingReaction } = await supabase
        .from('user_certificate_interactions')
        .select('id')
        .eq('user_id', userId)
        .eq('certificate_code', 'cert01')
        .eq('interaction_type', 'reaction')
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .eq('content', reactionType)
        .single()

      if (existingReaction) {
        // Remove reaction
        await supabase
          .from('user_certificate_interactions')
          .delete()
          .eq('id', existingReaction.id)
      } else {
        // Add reaction
        await supabase
          .from('user_certificate_interactions')
          .insert({
            user_id: userId,
            certificate_code: 'cert01',
            card_id: card!.id,
            interaction_type: 'reaction',
            target_type: targetType,
            target_id: targetId,
            content: reactionType
          })
      }

      // Reload comments to update reaction counts
      loadComments()
    } catch (error) {
      console.error('Error handling reaction:', error)
    }
  }

  const getReactionCount = (reactions: Reaction[], reactionType: string) => {
    return reactions.filter(r => r.reaction_type === reactionType).length
  }

  const hasUserReacted = (reactions: Reaction[], reactionType: string) => {
    return reactions.some(r => r.reaction_type === reactionType && r.user_id === userId)
  }

  if (!isOpen || !card) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{card.title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Card images */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <img
                  src={card.wasImage}
                  alt="Before"
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg"
                  }}
                />
                <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                  WAS
                </div>
              </div>
              <div className="relative">
                <img
                  src={card.becameImage}
                  alt="After"
                  className="w-full h-48 object-cover rounded-lg"
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

            <p className="text-gray-600 mb-4">{card.description}</p>

            {/* Card reactions */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-gray-700">React to this card:</span>
              <div className="flex gap-1">
                {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
                  const IconComponent = REACTION_ICONS[type as keyof typeof REACTION_ICONS]
                  const count = card.reaction_counts?.[type] || 0
                  return (
                    <button
                      key={type}
                      onClick={() => handleReaction('card', card.id, type)}
                      className="flex items-center gap-1 px-2 py-1 rounded border hover:bg-gray-50"
                    >
                      <IconComponent className="h-4 w-4" />
                      <span className="text-sm">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Comments section */}
          <div className="border-t">
            <div className="p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Comments
              </h3>

              {/* Add comment */}
              <div className="mb-4">
                <Textarea
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-2"
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>

              {/* Comments list */}
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center text-gray-500">Loading comments...</div>
                ) : comments.length === 0 ? (
                  <div className="text-center text-gray-500">No comments yet. Be the first to share your thoughts!</div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="border rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {comment.user_id.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 mb-2">{comment.comment_text}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                            <div className="flex gap-1">
                              {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
                                const count = getReactionCount(comment.reactions, type)
                                const hasReacted = hasUserReacted(comment.reactions, type)
                                const IconComponent = REACTION_ICONS[type as keyof typeof REACTION_ICONS]

                                return (
                                  <button
                                    key={type}
                                    onClick={() => handleReaction('comment', comment.id, type)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                      hasReacted ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                                    }`}
                                  >
                                    <IconComponent className="h-3 w-3" />
                                    <span>{count}</span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
