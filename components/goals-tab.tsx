"use client"

import { useState } from "react"
import { User } from "lucide-react"
import { useUser } from "@/components/UserContext"
import SecondaryTabs from "@/components/goals/secondary-tabs"
import WishBoard from "@/components/goals/wish-board"
import NotesPage from "@/components/goals/add-note"
import RecommendationsFeed from "@/components/goals/recommendations-feed"
import TaskOrganizer from "@/components/goals/task-organizer"
import Roadmap from "@/components/goals/roadmap"
import Results from "@/components/goals/results"
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

    // Show recommendations from WishBoard for unauthorized users
    if (!dbUser?.id) {
      // Temporarily show NotesPage for testing
      if (activeSecondaryTab === "addwish") {
        return <NotesPage />
      }
      // allow viewing results page for testing even when unauthenticated
      if (activeSecondaryTab === "results") {
        return <Results />
      }
      return <WishBoard showOnlyRecommendations={true} />
    }

    switch (activeSecondaryTab) {
      case "wishboard":
        return <WishBoard showOnlyRecommendations={false} />
      case "addwish":
        return <NotesPage />
      case "tasks":
        return <TaskOrganizer />
      case "roadmap":
        return <Roadmap />
      case "results":
        return <Results />
      default:
        return <WishBoard showOnlyRecommendations={false} />
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
      <div className="flex-1 overflow-y-auto pb-12">{renderSecondaryTab()}</div>
    </div>
  )
}
