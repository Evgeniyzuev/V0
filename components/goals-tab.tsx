"use client"

import { useState } from "react"
import SecondaryTabs from "@/components/goals/secondary-tabs"
import WishBoard from "@/components/goals/wish-board"
import AddWish from "@/components/goals/add-wish"
import RecommendationsFeed from "@/components/goals/recommendations-feed"
import TaskOrganizer from "@/components/goals/task-organizer"
import Roadmap from "@/components/goals/roadmap"
import Notebook from "@/components/goals/notebook"

export default function GoalsTab() {
  const [activeSecondaryTab, setActiveSecondaryTab] = useState("wishboard")

  const renderSecondaryTab = () => {
    switch (activeSecondaryTab) {
      case "wishboard":
        return <WishBoard />
      case "addwish":
        return <AddWish />
      case "recommendations":
        return <RecommendationsFeed />
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
        <SecondaryTabs activeTab={activeSecondaryTab} setActiveTab={setActiveSecondaryTab} />
      </div>
      <div className="flex-1 overflow-y-auto">{renderSecondaryTab()}</div>
    </div>
  )
}

