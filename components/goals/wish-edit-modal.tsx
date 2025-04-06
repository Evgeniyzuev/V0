"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface WishEditModalProps {
  isOpen: boolean
  onClose: () => void
  wish: {
    id: number
    imageUrl: string
    title: string
    description: string
  }
  onUpdate: (updatedWish: {
    id: number
    imageUrl: string
    title: string
    description: string
  }) => void
}

export default function WishEditModal({ isOpen, onClose, wish, onUpdate }: WishEditModalProps) {
  const [title, setTitle] = useState(wish.title)
  const [description, setDescription] = useState(wish.description)
  const [imageUrl, setImageUrl] = useState(wish.imageUrl)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate({
      ...wish,
      title,
      description,
      imageUrl,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Wish</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter wish title" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter wish description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image Preview</Label>
            <div className="w-full aspect-square overflow-hidden rounded-md">
              <img src={imageUrl || "/placeholder.svg"} alt={title} className="w-full h-full object-cover" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

