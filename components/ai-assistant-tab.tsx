"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Bot, Send, Paperclip } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "./UserContext"
import { createAIContext, type UserGoal, type UserTask, type DbUser } from "@/types/user-context"
import { generateSystemInstructions, generateDailyGreeting, generateInterestingSuggestion } from "@/lib/ai/assistant-instructions"
import type { Database } from "@/types/supabase"

type DbGoal = Database['public']['Tables']['user_goals']['Row']
type DbTask = Database['public']['Tables']['tasks']['Row']

interface ChatMessage {
  sender: string;
  text: string;
  timestamp: string;
}

interface DailyContext {
  isFirstVisitToday: boolean;
  lastVisitTimestamp?: string;
  completedTodayTasks: number;
  pendingHighPriorityTasks: number;
}

interface ExtendedDbUser extends Omit<DbUser, 'goals' | 'tasks'> {
  goals?: DbGoal[];
  tasks?: DbTask[];
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
      const activeGoals = goals.filter(goal => goal.progress < 100);
      if (activeGoals.length > 0) {
        return `Hi ${name}! I see you're working on "${activeGoals[0].title}". How can I help you make progress on this goal today?`;
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
      console.log("Generating welcome message with user data:", {
        hasUser: !!dbUser,
        goals: (dbUser as ExtendedDbUser)?.goals?.length || 0,
        tasks: (dbUser as ExtendedDbUser)?.tasks?.length || 0
      });
      
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

    setChatHistory((prev) => [...prev, userMessage])
    setMessage("")
    setIsLoading(true)

    try {
      console.log("Creating AI context with user data:", {
        hasUser: !!dbUser,
        userData: dbUser && {
          id: dbUser.id,
          goals: (dbUser as ExtendedDbUser)?.goals?.length || 0,
          tasks: (dbUser as ExtendedDbUser)?.tasks?.length || 0
        }
      });

      // Transform goals and tasks to match expected format
      const transformedGoals = ((dbUser as ExtendedDbUser)?.goals || []).map(goal => ({
        id: String(goal.id),
        title: goal.title || 'Untitled Goal',
        description: goal.description || '',
        progress: goal.progress_percentage || 0,
        status: mapGoalStatus(goal.status),
        priority: 1,
        dueDate: goal.target_date || undefined,
        tasks: [] // Tasks will be added from the tasks array
      } as UserGoal));

      const transformedTasks = ((dbUser as ExtendedDbUser)?.tasks || []).map(task => ({
        id: String(task.id),
        goalId: task.goal_id ? String(task.goal_id) : undefined,
        title: task.title,
        description: task.description || '',
        status: mapTaskStatus('TODO'), // Default to TODO since Task type doesn't have status
        priority: 'medium',
        dueDate: task.due_date || undefined
      } as UserTask));

      // Add tasks to their respective goals
      transformedTasks.forEach(task => {
        if (task.goalId) {
          const goal = transformedGoals.find(g => g.id === task.goalId);
          if (goal && Array.isArray(goal.tasks)) {
            goal.tasks.push(task);
          }
        }
      });

      // Create aiContext with transformed data
      const aiContext = dbUser ? createAIContext({
        ...dbUser,
        goals: transformedGoals,
        tasks: transformedTasks
      } as unknown as DbUser) : null;
      
      console.log("Created AI context:", {
        hasContext: !!aiContext,
        profile: aiContext?.profile,
        goalsCount: aiContext?.goals.length || 0,
        tasksCount: aiContext?.tasks.length || 0,
        goals: aiContext?.goals,
        tasks: aiContext?.tasks
      });

      const systemInstructions = generateSystemInstructions();

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

// Add helper functions at the end of the file
function mapGoalStatus(status: string): 'BACKLOG' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED' {
  const statusMap: Record<string, 'BACKLOG' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED'> = {
    'not_started': 'BACKLOG',
    'in_progress': 'IN_PROGRESS',
    'completed': 'DONE',
    'paused': 'BACKLOG',
    'abandoned': 'ARCHIVED'
  };
  return statusMap[status] || 'BACKLOG';
}

function mapTaskStatus(status: string): 'TODO' | 'IN_PROGRESS' | 'DONE' {
  const statusMap: Record<string, 'TODO' | 'IN_PROGRESS' | 'DONE'> = {
    'todo': 'TODO',
    'in_progress': 'IN_PROGRESS',
    'done': 'DONE'
  };
  return statusMap[status.toLowerCase()] || 'TODO';
}

