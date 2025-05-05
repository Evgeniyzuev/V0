import { AIAssistantContext } from "@/types/user-context";

interface DailyContext {
  isFirstVisitToday: boolean;
  lastVisitTimestamp?: string;
  completedTodayTasks: number;
  pendingHighPriorityTasks: number;
}

interface UserContext {
  dbUser: any;
  goals: any[] | null;
  tasks: any[] | null;
}

// Все функции генерации промптов и инструкций перенесены в AIAssistantEngine.
// Этот файл теперь содержит только интерфейсы и типы для совместимости. 