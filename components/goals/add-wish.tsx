"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Camera } from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useUser } from "@/components/UserContext"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { Goal } from "@/types/supabase"

export default function AddWish() {
  const { dbUser } = useUser()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState<string>("")
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [estimatedCost, setEstimatedCost] = useState("")
  const [difficultyLevel, setDifficultyLevel] = useState(1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!dbUser?.id) {
      toast.error("Please log in to add a wish")
      return
    }

    if (!title.trim()) {
      toast.error("Please enter a wish title")
      return
    }

    if (!imageUrl.trim()) {
      toast.error("Please enter an image URL")
      return
    }

    try {
      const supabase = createClientSupabaseClient()

      // Create a user_goal entry directly
      const { error: userGoalError } = await supabase
        .from("user_goals")
        .insert([
          {
            user_id: dbUser.id,
            title,
            description,
            image_url: imageUrl,
            estimated_cost: estimatedCost,
            difficulty_level: difficultyLevel,
            status: "not_started",
            progress_percentage: 0,
            steps: []
          }
        ])

      if (userGoalError) {
        throw new Error(userGoalError.message)
      }

      // Invalidate queries to refresh the goals list
      await queryClient.invalidateQueries({ queryKey: ["user-goals"] })

      toast.success("Wish added successfully!")

      // Reset form
      setTitle("")
      setDescription("")
      setImageUrl("")
      setEstimatedCost("")
      setDifficultyLevel(1)
    } catch (error) {
      console.error("Error adding wish:", error)
      toast.error(`Failed to add wish: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setImageUrl(url)
    setIsPreviewLoading(true)
  }

  return (
    <div className="p-4 bg-white">
      <h1 className="text-3xl font-bold mb-2">Add New Wish</h1>
      <p className="text-gray-600 mb-6">Create a new goal to visualize and achieve</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-gray-700 font-medium">Wish Image URL</label>
          <Input
            type="url"
            placeholder="Enter image URL"
            value={imageUrl}
            onChange={handleImageUrlChange}
            className="w-full"
          />
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Wish preview"
                className="max-h-40 object-contain mb-2"
                onLoad={() => setIsPreviewLoading(false)}
                onError={() => {
                  setIsPreviewLoading(false)
                  toast.error("Failed to load image preview")
                }}
              />
            ) : (
              <>
                <Camera className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-500 text-center">Enter an image URL above</p>
                <p className="text-gray-400 text-sm text-center mt-1">The image will be previewed here</p>
              </>
            )}
            {isPreviewLoading && <p className="text-gray-500 mt-2">Loading preview...</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="title" className="text-gray-700 font-medium">
            Wish Title
          </label>
          <Input
            id="title"
            placeholder="What do you want to achieve?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-gray-700 font-medium">
            Description
          </label>
          <Textarea
            id="description"
            placeholder="Describe your wish in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="estimatedCost" className="text-gray-700 font-medium">
            Estimated Cost
          </label>
          <Input
            id="estimatedCost"
            placeholder="e.g., $100, Free, etc."
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="difficultyLevel" className="text-gray-700 font-medium">
            Difficulty Level (1-20)
          </label>
          <Input
            id="difficultyLevel"
            type="number"
            min={1}
            max={20}
            value={difficultyLevel}
            onChange={(e) => setDifficultyLevel(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <Button type="submit" className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3">
          Save Wish
        </Button>
      </form>
    </div>
  )
}

