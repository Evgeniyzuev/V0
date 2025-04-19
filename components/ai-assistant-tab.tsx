"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Bot, Send, Paperclip, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "./UserContext"
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
  const { dbUser, goals, tasks, isLoading: isUserContextLoading } = useUser()
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

    const userTasks = tasks || [];
    const today = new Date().toDateString();
    
    const completedToday = userTasks.filter(task => 
      task.status === 'completed' && 
      task.assigned_at && new Date(task.assigned_at).toDateString() === today
    ).length;

    const highPriority = userTasks.filter(task => 
      task.status !== 'completed'
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
    // Check if user data is still loading
    if (isUserContextLoading || !dbUser) {
      return "Hi there! I'm your personal AI assistant. Connecting to your profile...";
    }

    const dailyContext = getDailyContext();
    let baseMessage = "";
    const userGoals = goals || []; // Use goals from context
    const userTasks = tasks || []; // Use tasks from context

    // Pass current dbUser, goals, tasks to generation functions
    const greeting = generateDailyGreeting({ dbUser, goals, tasks }, dailyContext);
    if (greeting) {
      const suggestion = generateInterestingSuggestion({ dbUser, goals, tasks });
      baseMessage = `${greeting}\n\n${suggestion}`;
    } else {
      // Fallback to regular welcome message if no daily greeting
      const name = dbUser.first_name || dbUser.telegram_username || 'there';
      if (userGoals.length > 0) {
        const activeGoals = userGoals.filter(goal => goal.status !== 'completed');
        if (activeGoals.length > 0) {
          const goalTitles = activeGoals.map(goal => 
            `"${goal.title || goal.goal?.title || `Goal ${goal.id}`}"`
          ).join(', ');
          baseMessage = `Hi ${name}! You're working on these goals: ${goalTitles}. How can I help you make progress on them today?`;
        }
      }

      if (!baseMessage && userTasks.length > 0) {
        const pendingTasks = userTasks.filter(task => task.status !== 'completed');
        if (pendingTasks.length > 0) {
          baseMessage = `Hi ${name}! You have ${pendingTasks.length} pending ${pendingTasks.length === 1 ? 'task' : 'tasks'}. How can I help you make progress today?`;
        }
      }

      if (!baseMessage) {
        baseMessage = `Hi ${name}! I'm your personal AI assistant. Let's work on setting some meaningful goals for you today. What would you like to achieve?`;
      }
    }

    // // Add debugging info about goals with titles
    // if (userGoals.length > 0) {
    //   const goalTitles = userGoals.map(goal => 
    //     goal.title || goal.goal?.title || `Goal ${goal.id}`
    //   ).join(', ');
    //   baseMessage += `\n\n(Debug: I see ${userGoals.length} goal(s) loaded: ${goalTitles})`;
    // } else {
    //   baseMessage += `\n\n(Debug: I don't see any goals loaded currently.)`;
    // }

    // // Add debugging info about tasks
    // if (userTasks.length > 0) {
    //   const taskTitles = userTasks.map(task => 
    //     task.task?.title || `Task ${task.id}`
    //   ).join(', ');
    //   baseMessage += `\n\n(Debug: I see ${userTasks.length} task(s) loaded: ${taskTitles})`;
    // } else {
    //   baseMessage += `\n\n(Debug: I don't see any tasks loaded currently.)`;
    // }

    return baseMessage;
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

  // Initialize chat history - wait for user context
  useEffect(() => {
    // Wait until user context is NOT loading and initialization hasn't run
    if (isInitialized || isUserContextLoading) return;

    const savedHistory = loadChatHistory();
    
    if (savedHistory.length === 0) {
      // Generate welcome message *after* context might be loaded
      setChatHistory([{ 
        sender: "assistant", 
        text: generateWelcomeMessage(), // Call it here when context is ready
        timestamp: new Date().toISOString() 
      }]);
    } else {
      setChatHistory(savedHistory);
    }
    
    setIsInitialized(true);
  }, [dbUser, goals, tasks, isUserContextLoading, isInitialized]); // Depend on loading state and data

  // Save chat history when it changes
  useEffect(() => {
    // Only save if initialized and history has content
    if (isInitialized && chatHistory.length > 0) {
      saveChatHistory(chatHistory);
    }
  }, [chatHistory, dbUser?.id, isInitialized]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    // Ensure user context is loaded before sending
    if (!message.trim() || isLoading || isUserContextLoading) return

    const userMessage = {
      sender: "user",
      text: message,
      timestamp: new Date().toISOString(),
    }

    // Set flag for task verification
    localStorage.setItem('hasInteractedWithAI', 'true');

    setChatHistory((prev) => [...prev, userMessage])
    setMessage("")
    setIsLoading(true)

    try {
      const systemInstructions = generateSystemInstructions({ dbUser, goals, tasks });
      console.log("Sending to /api/chat with context:", { dbUser, goals, tasks }); // Log the context being sent

      // Call our server API endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...chatHistory, userMessage],
          // Pass the current state of dbUser, goals, tasks
          userContext: { dbUser, goals, tasks }, 
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

  const clearHistory = () => {
    if (typeof window === 'undefined') return;
    const userId = dbUser?.id || 'anonymous';
    localStorage.removeItem(`chat_history_${userId}`);
    setChatHistory([{
      sender: "assistant",
      text: generateWelcomeMessage(),
      timestamp: new Date().toISOString(),
    }]);
  };

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
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="text-gray-400 hover:text-red-500" 
            onClick={clearHistory}
            title="Clear chat history"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
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

