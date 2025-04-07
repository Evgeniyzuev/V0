"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Camera } from "lucide-react"

export default function AddWish() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log({ title, description, imageUrl })
    // Reset form
    setTitle("")
    setDescription("")
    setImageUrl(null)
  }

  return (
    <div className="p-4 bg-white">
      <h1 className="text-3xl font-bold mb-2">Add New Wish</h1>
      <p className="text-gray-600 mb-6">Create a new goal to visualize and achieve</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-gray-700 font-medium">Wish Image</label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer"
            onClick={() => {
              /* Open file picker */
            }}
          >
            {imageUrl ? (
              <img src={imageUrl || "/placeholder.svg"} alt="Wish preview" className="max-h-40 object-contain mb-2" />
            ) : (
              <>
                <Camera className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-500 text-center">Click to upload an image</p>
                <p className="text-gray-400 text-sm text-center mt-1">PNG, JPG up to 10MB</p>
              </>
            )}
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

        <Button type="submit" className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3">
          Save Wish
        </Button>
      </form>
    </div>
  )
}

