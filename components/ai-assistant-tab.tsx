"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Bot, Send, Paperclip } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "./UserContext"
import { createAIContext, type UserGoal, type UserTask } from "@/types/user-context"
import { generateSystemInstructions, generateDailyGreeting, generateInterestingSuggestion } from "@/lib/ai/assistant-instructions"

interface ChatMessage {
  sender: string;
  text: string;
  timestamp: string;
}

interface DbGoal {
  id: number;
  user_id: string;
  goal_id: number | null;
  title?: string;
  notes?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'archived';
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

interface DailyContext {
  isFirstVisitToday: boolean;
  lastVisitTimestamp?: string;
  completedTodayTasks: number;
  pendingHighPriorityTasks: number;
}

export default function AIAssistantTab() {
  const { toast } = useToast()
  const { dbUser } = useUser()
  const [message, setMessage] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastVisitDate, setLastVisitDate] = useState<string | undefined>(undefined)

  // Check if this is first visit today
  const checkFirstVisitToday = () => {
    if (typeof window === 'undefined') return false;
    
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem(`last_visit_${dbUser?.id || 'anonymous'}`);
    const isFirstToday = lastVisit !== today;
    
    if (isFirstToday) {
      localStorage.setItem(`last_visit_${dbUser?.id || 'anonymous'}`, today);
      setLastVisitDate(today);
    }
    
    return isFirstToday;
  };

  // Get daily context for AI
  const getDailyContext = (): DailyContext => {
    if (!dbUser) return {
      isFirstVisitToday: checkFirstVisitToday(),
      completedTodayTasks: 0,
      pendingHighPriorityTasks: 0
    };

    const tasks = (dbUser as any).tasks as UserTask[] || [];
    const today = new Date().toDateString();
    
    const completedToday = tasks.filter(task => 
      task.status === 'DONE' && 
      new Date(task.dueDate || '').toDateString() === today
    ).length;

    const highPriority = tasks.filter(task => 
      task.status !== 'DONE' && 
      task.priority === 'high'
    ).length;

    return {
      isFirstVisitToday: checkFirstVisitToday(),
      lastVisitTimestamp: lastVisitDate,
      completedTodayTasks: completedToday,
      pendingHighPriorityTasks: highPriority
    };
  };

  // Generate welcome message with daily context
  const generateWelcomeMessage = () => {
    if (!dbUser) {
      return "Hi there! I'm your personal AI assistant. Thousands of users have already achieved their goals with my help. I can help you succeed too. Sign in to get started on your journey!";
    }

    const aiContext = createAIContext(dbUser);
    const dailyContext = getDailyContext();

    // Generate daily greeting if it's first visit
    const greeting = generateDailyGreeting(aiContext, dailyContext);
    if (greeting) {
      const suggestion = generateInterestingSuggestion(aiContext);
      return `${greeting}\n\n${suggestion}`;
    }

    // Fallback to regular welcome message
    const name = dbUser.first_name || dbUser.telegram_username || 'there';
    const goals = (dbUser as any).goals as UserGoal[] || [];
    const tasks = (dbUser as any).tasks as UserTask[] || [];

    if (goals.length > 0) {
      const activeGoals = goals.filter(goal => goal.status !== 'completed');
      if (activeGoals.length > 0) {
        return `Hi ${name}! I see you're working on "${activeGoals[0].title || `Goal ${activeGoals[0].id}`}". How can I help you make progress on this goal today?`;
      }
    }

    if (tasks.length > 0) {
      const pendingTasks = tasks.filter(task => task.status !== 'DONE');
      if (pendingTasks.length > 0) {
        const highPriorityTasks = pendingTasks.filter(task => task.priority === 'high');
        if (highPriorityTasks.length > 0) {
          return `Hi ${name}! You have ${highPriorityTasks.length} high-priority ${highPriorityTasks.length === 1 ? 'task' : 'tasks'} to focus on. Would you like to discuss how to tackle ${highPriorityTasks.length === 1 ? 'it' : 'them'}?`;
        }
        return `Hi ${name}! You have ${pendingTasks.length} pending ${pendingTasks.length === 1 ? 'task' : 'tasks'}. How can I help you make progress today?`;
      }
    }

    return `Hi ${name}! I'm your personal AI assistant. Let's work on setting some meaningful goals for you today. What would you like to achieve?`;
  };

  // Load chat history from localStorage
  const loadChatHistory = () => {
    if (typeof window === 'undefined') return [];
    
    try {
      const userId = dbUser?.id || 'anonymous';
      const savedHistory = localStorage.getItem(`chat_history_${userId}`);
      if (savedHistory) {
        return JSON.parse(savedHistory) as ChatMessage[];
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
    return [];
  };

  // Save chat history to localStorage
  const saveChatHistory = (history: ChatMessage[]) => {
    if (typeof window === 'undefined') return;
    
    try {
      const userId = dbUser?.id || 'anonymous';
      localStorage.setItem(`chat_history_${userId}`, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  // Initialize chat history
  useEffect(() => {
    if (isInitialized) return;

    const savedHistory = loadChatHistory();
    
    if (savedHistory.length === 0) {
      // If no saved history, set welcome message
      setChatHistory([{
        sender: "assistant",
        text: generateWelcomeMessage(),
        timestamp: new Date().toISOString(),
      }]);
    } else {
      setChatHistory(savedHistory);
    }
    
    setIsInitialized(true);
  }, [dbUser, isInitialized]);

  // Save chat history when it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      saveChatHistory(chatHistory);
    }
  }, [chatHistory, dbUser?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim() || isLoading) return

    const userMessage = {
      sender: "user",
      text: message,
      timestamp: new Date().toISOString(),
    }

    // Add user message to chat
    setChatHistory((prev) => [...prev, userMessage])

    // Clear input
    setMessage("")
    setIsLoading(true)

    try {
      const aiContext = dbUser ? createAIContext(dbUser) : null;
      const systemInstructions = generateSystemInstructions();

      // Call our server API endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...chatHistory, userMessage],
          userContext: aiContext,
          systemInstructions,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response from server")
      }

      // Add assistant response to chat
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: data.response,
          timestamp: new Date().toISOString(),
        },
      ])
    } catch (error) {
      console.error("Error calling chat API:", error)
      // Show error toast notification
      toast({
        variant: "destructive",
        title: "AI Assistant Error",
        description: error instanceof Error ? error.message : "Sorry, I encountered an error connecting to the AI. Please try again.",
      })
      // Add error message to chat
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: error instanceof Error ? error.message : "Sorry, I encountered an error. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.sender === "user" ? "bg-purple-100 text-gray-800" : "bg-white border border-gray-200 text-gray-800"
              }`}
            >
              {msg.sender === "assistant" && (
                <div className="flex items-center mb-1 text-xs text-purple-600">
                  <Bot className="h-3 w-3 mr-1" />
                  <span>Assistant • {formatTime(msg.timestamp)}</span>
                </div>
              )}
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Message input */}
      <div className="p-3 bg-white border-t pb-14">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            placeholder="Ask about your goals..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-gray-100 border-0"
            disabled={isLoading}
          />
          <Button type="button" variant="ghost" size="icon" className="text-gray-400" disabled={isLoading}>
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button type="submit" variant="ghost" size="icon" className="text-purple-600" disabled={isLoading}>
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-purple-600"></div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

