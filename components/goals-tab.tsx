"use client"

import { useState } from "react"
import { User } from "lucide-react"
import { useUser } from "@/components/UserContext"
import SecondaryTabs from "@/components/goals/secondary-tabs"
import WishBoard from "@/components/goals/wish-board"
import AddWish from "@/components/goals/add-wish"
import RecommendationsFeed from "@/components/goals/recommendations-feed"
import TaskOrganizer from "@/components/goals/task-organizer"
import Roadmap from "@/components/goals/roadmap"
import Notebook from "@/components/goals/notebook"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function GoalsTab() {
  const { dbUser, isLoading: isUserLoading } = useUser()
  const [activeSecondaryTab, setActiveSecondaryTab] = useState("wishboard")

  const renderSecondaryTab = () => {
    // Always show recommendations feed regardless of auth status
    if (activeSecondaryTab === "recommendations") {
      return <RecommendationsFeed />
    }

    // Show auth required message for other tabs if not authenticated
    if (!dbUser?.id) {
      return (
        <div className="p-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center flex flex-col items-center gap-4">
                <h3 className="text-lg font-medium">Access to Goals</h3>
                <p className="text-gray-500 mb-4">To access your goals, please log in to the system</p>
                <Avatar className="h-20 w-20 mx-auto mb-2">
                  <AvatarFallback>
                    <User className="h-10 w-10 text-gray-400" />
                  </AvatarFallback>
                </Avatar>
                
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 px-6"
                  onClick={() => {
                    const socialButton = document.querySelector('button[aria-label="Social"]');
                    if (socialButton instanceof HTMLElement) {
                      socialButton.click();
                    }
                  }}
                >
                  <User className="h-5 w-5" />
                  Go to Profile
                </Button>

                <p className="text-xs text-gray-400 mt-4">
                  After logging in, you will get access to all application features
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    switch (activeSecondaryTab) {
      case "wishboard":
        return <WishBoard />
      case "addwish":
        return <AddWish />
      case "tasks":
        return <TaskOrganizer />
      case "roadmap":
        return <Roadmap />
      case "notebook":
        return <Notebook />
      default:
        return <WishBoard />
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <SecondaryTabs 
          activeTab={activeSecondaryTab} 
          setActiveTab={setActiveSecondaryTab}
          isAuthenticated={!!dbUser?.id}
        />
      </div>
      <div className="flex-1 overflow-y-auto">{renderSecondaryTab()}</div>
    </div>
  )
}

