"use client"

import { useState } from "react"
import SocialTabs from "@/components/social/social-tabs"
import PostsTab from "@/components/social/posts-tab"
import UserProfileTab from "@/components/social/user-profile-tab"
import UsersTab from "@/components/social/users-tab"

export default function CommunityTab() {
  const [activeTab, setActiveTab] = useState("posts")

  const renderActiveTab = () => {
    switch (activeTab) {
      case "posts":
        return <PostsTab />
      case "users":
        return <UsersTab />
      case "profile":
        return <UserProfileTab />
      default:
        return <PostsTab />
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <SocialTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <div className="flex-1 overflow-y-auto">{renderActiveTab()}</div>
    </div>
  )
}

