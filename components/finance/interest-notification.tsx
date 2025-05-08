import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { createClientSupabaseClient } from "@/lib/supabase"

const supabase = createClientSupabaseClient()

interface InterestNotificationProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  interestAmount: number
}

export default function InterestNotification({ isOpen, onClose, userId, interestAmount }: InterestNotificationProps) {
  const handleClose = async () => {
    // Update view date when user clicks OK
    await supabase.rpc('update_interest_view_date', { user_id: userId })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Daily Interest Earned!</DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <div className="text-center space-y-4">
            <p className="text-lg font-medium">You've earned</p>
            <p className="text-2xl font-bold text-green-600">
              ${interestAmount.toFixed(8)}
            </p>
            <p className="text-sm text-gray-500">
              in daily interest
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            className="w-full"
            onClick={handleClose}
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 