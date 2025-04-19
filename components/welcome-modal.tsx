"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            Welcome!
          </DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <div className="text-center space-y-4">
            <p className="text-lg font-medium">Hello! 👋</p>
            <p className="text-gray-600">
              Your AI assistant has helped thousands of users organize their lives, solve problems, and fulfill their wishes.
            </p>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-700">
                You can see success stories in the feed and follow one of them, or create your own path.
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                In the tasks section, you can earn your first $ right now!
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            className="w-full"
            onClick={onClose}
          >
            Let's Get Started!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 