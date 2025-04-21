import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"

interface FinanceTabProps {
  setActiveTab: (tab: string) => void;
}

export function FinanceTab({ setActiveTab }: FinanceTabProps) {
  return (
    <div className="p-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-medium">Access to Finance</h3>
            <p className="text-gray-500 mb-4">To access your balance, please log in to the system</p>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setActiveTab("profile")}
            >
              <User className="h-4 w-4" />
              Go to Profile
            </Button>
            <p className="text-xs text-gray-400 mt-4">
              After logging in, you will get access to financial management
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 