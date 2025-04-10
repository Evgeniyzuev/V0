"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Crown } from "lucide-react"
import { calculateRequiredCoreForLevel } from "@/lib/utils"

interface LevelUpModalProps {
  isOpen: boolean
  onClose: () => void
  newLevel: number
}

export default function LevelUpModal({ isOpen, onClose, newLevel }: LevelUpModalProps) {
  const nextLevelCore = calculateRequiredCoreForLevel(newLevel + 1)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Level Up!
          </DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="text-6xl font-bold text-purple-600">{newLevel}</div>
                <div className="absolute -top-2 -right-4 text-2xl text-yellow-500">★</div>
              </div>
            </div>
            <p className="text-lg font-medium">Congratulations!</p>
            <p className="text-gray-600">
              You've reached Level {newLevel}
            </p>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-700 mb-2">Next Level</p>
              <div className="text-purple-700">
                <span className="text-sm">Reach </span>
                <span className="text-xl font-bold">${nextLevelCore}</span>
                <span className="text-sm"> core to achieve Level {newLevel + 1}</span>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            className="w-full"
            onClick={onClose}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 