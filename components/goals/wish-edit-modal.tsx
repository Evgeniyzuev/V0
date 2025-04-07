"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

interface WishEditModalProps {
  isOpen: boolean
  onClose: () => void
  wish: {
    id: number
    imageUrl: string
    title: string
    description: string
    progress?: number
    targetDate?: string
    estimatedCost?: string
    steps?: string[]
  }
  onUpdate: (updatedWish: {
    id: number
    imageUrl: string
    title: string
    description: string
    progress?: number
    targetDate?: string
    estimatedCost?: string
    steps?: string[]
  }) => void
}

export default function WishEditModal({ isOpen, onClose, wish, onUpdate }: WishEditModalProps) {
  const [title, setTitle] = useState(wish.title)
  const [description, setDescription] = useState(wish.description)
  const [imageUrl, setImageUrl] = useState(wish.imageUrl)
  const [progress, setProgress] = useState(wish.progress || 0)
  const [targetDate, setTargetDate] = useState(wish.targetDate || "")
  const [estimatedCost, setEstimatedCost] = useState(wish.estimatedCost || "")
  const [stepsText, setStepsText] = useState(wish.steps ? wish.steps.join("\n") : "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const steps = stepsText
      .split("\n")
      .map((step) => step.trim())
      .filter((step) => step.length > 0)

    onUpdate({
      ...wish,
      title,
      description,
      imageUrl,
      progress,
      targetDate,
      estimatedCost,
      steps,
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
            <Label>Progress ({progress}%)</Label>
            <Slider value={[progress]} min={0} max={100} step={5} onValueChange={(values) => setProgress(values[0])} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                placeholder="e.g., Dec 2023"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedCost">Estimated Cost</Label>
              <Input
                id="estimatedCost"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="e.g., $1,000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="steps">Steps (one per line)</Label>
            <Textarea
              id="steps"
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              placeholder="Enter steps to achieve this wish"
              rows={4}
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

