"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/utils/supabase/client"
import { useUser } from "@/hooks/useUser"
import toast from "react-hot-toast"
import Image from "next/image"

type NewWish = {
  user_id: string
  title: string
  description: string
  image_url: string | null
  status?: 'not_started' | 'in_progress' | 'completed' | 'paused'
  started_at?: string | null
  target_date?: string | null
  completed_at?: string | null
  progress_percentage?: number
  notes?: string | null
}

export default function AddWish() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const { user: dbUser } = useUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dbUser) {
      toast.error("You must be logged in to add a wish.")
      return
    }
    if (!title) {
      toast.error("Please enter a title for your wish.")
      return
    }

    setLoading(true)
    const supabase = createClient()

    const newWish: NewWish = {
      user_id: dbUser.id,
      title: title,
      description: description,
      image_url: imageUrl || null,
      status: 'not_started',
      progress_percentage: 0,
    }

    try {
      const { error } = await supabase.from("user_goals").insert([newWish])

      if (error) {
        throw error
      }

      toast.success("Wish saved successfully!")
      setTitle("")
      setDescription("")
      setImageUrl("")
    } catch (error: any) {
      console.error("Error saving wish:", error)
      toast.error(`Error saving wish: ${error.message || "Please try again."}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Add New Wish</h1>
      <p className="text-gray-600 mb-6">Create a new goal to visualize and achieve.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="imageUrl" className="text-gray-700 font-medium">
            Image URL (Optional)
          </label>
          <Input
            id="imageUrl"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full"
          />
          {imageUrl && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg flex justify-center items-center bg-gray-50">
              <Image
                src={imageUrl}
                alt="Wish preview"
                width={200}
                height={200}
                className="max-h-40 w-auto object-contain rounded"
                onError={(e) => {
                  console.error("Image failed to load:", e)
                }}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="title" className="text-gray-700 font-medium">
            Wish Title*
          </label>
          <Input
            id="title"
            placeholder="What do you want to achieve?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-gray-700 font-medium">
            Description
          </label>
          <Textarea
            id="description"
            placeholder="Describe your wish in detail... (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 transition duration-150 ease-in-out disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Wish"}
        </Button>
      </form>
    </div>
  )
}

