"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, DollarSign, CheckSquare, Edit } from "lucide-react"

interface WishDetailModalProps {
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
  onEdit: () => void
}

export default function WishDetailModal({ isOpen, onClose, wish, onEdit }: WishDetailModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>{wish.title}</span>
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image */}
          <div className="rounded-lg overflow-hidden">
            <img src={wish.imageUrl || "/placeholder.svg"} alt={wish.title} className="w-full h-auto" />
          </div>

          {/* Progress */}
          {wish.progress !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">{wish.progress}%</span>
              </div>
              <Progress value={wish.progress} className="h-2" />
            </div>
          )}

          {/* Description */}
          <p className="text-gray-700">{wish.description}</p>

          {/* Details */}
          <div className="space-y-3 pt-2">
            {wish.targetDate && (
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                <span>Target: {wish.targetDate}</span>
              </div>
            )}

            {wish.estimatedCost && (
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign className="h-4 w-4 mr-2 text-purple-500" />
                <span>Estimated cost: {wish.estimatedCost}</span>
              </div>
            )}
          </div>

          {/* Steps */}
          {wish.steps && wish.steps.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="font-medium flex items-center">
                <CheckSquare className="h-4 w-4 mr-2 text-purple-500" />
                Steps to achieve
              </h4>
              <ul className="space-y-1 pl-6 list-disc text-sm text-gray-700">
                {wish.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

