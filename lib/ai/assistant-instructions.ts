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

export function generateSystemInstructions(): string {
  return `You are an AI assistant in the WeAi platform - a decentralized social platform and public life-support system. 
Your mission is to help users maximize their potential, achieve their goals, and contribute to solving global challenges.

CORE PRINCIPLES:
1. Focus on Action & Value
- Always provide specific, actionable advice
- Suggest concrete next steps
- Link suggestions to user's goals and tasks

2. Personalization & Context
- Use user's name, level, and history
- Reference their specific goals and tasks
- Acknowledge their progress and achievements

3. Motivation & Support
- Be encouraging but realistic
- Celebrate small wins
- Help break down big goals into manageable steps

4. Resource Optimization
- Help users find and utilize available resources
- Suggest efficient approaches
- Consider time and effort constraints

5. Communication Style
- Be concise and clear
- Use professional but friendly tone
- Structure responses for easy reading

RESPONSE STRUCTURE:
1. Greeting/Acknowledgment (personalized)
2. Direct answer/suggestion
3. Context/Reasoning (brief)
4. Specific next action
5. Encouragement/Support

DEBUG INFORMATION:
- You have access to user's goals and tasks
- Tasks are passed in the userContext.tasks array
- Each task has properties like title, status, assigned_at
- Use this information to provide relevant suggestions

Remember: Your goal is to help users achieve real progress while building a sustainable, supportive system for all.`;
}

export function generateDailyGreeting(context: UserContext, dailyContext: DailyContext): string {
  const { dbUser, goals, tasks } = context;
  const { isFirstVisitToday, lastVisitTimestamp, completedTodayTasks, pendingHighPriorityTasks } = dailyContext;

  const name = dbUser?.first_name || dbUser?.telegram_username || 'there';
  
  // Debug info about goals and tasks
  let debugInfo = '';
  if (goals?.length) {
    const goalTitles = goals.map(goal => goal.title || `Goal ${goal.id}`).join(', ');
    debugInfo += `\n\n(Debug: I see ${goals.length} goal(s): ${goalTitles})`;
  }
  if (tasks?.length) {
    const taskTitles = tasks.map(task => task.title || `Task ${task.id}`).join(', ');
    debugInfo += `\n\n(Debug: I see ${tasks.length} task(s): ${taskTitles})`;
  }
  
  if (isFirstVisitToday) {
    if (lastVisitTimestamp) {
      return `Welcome back, ${name}! Since your last visit, you've completed ${completedTodayTasks} tasks. You have ${pendingHighPriorityTasks} tasks that need attention.${debugInfo}`;
    }
    return `Good to see you, ${name}! You have ${pendingHighPriorityTasks} tasks waiting for you today.${debugInfo}`;
  }

  if (!goals || !tasks) return `Hi ${name}! Let's get started with your journey.${debugInfo}`;

  const activeGoals = goals.filter(goal => goal.status !== 'completed');
  const pendingTasks = tasks.filter(task => task.status !== 'completed');

  if (activeGoals.length > 0) {
    return `Hi ${name}! Let's continue working on your goals. You have ${activeGoals.length} active goals and ${pendingTasks.length} pending tasks.${debugInfo}`;
  }

  return debugInfo;
}

export function generateContextBasedPrompt(context: AIAssistantContext, scenario: string): string {
  const { profile, goals, tasks } = context;

  // Debug info about goals and tasks
  let debugInfo = '';
  if (goals?.length) {
    const goalTitles = goals.map(goal => goal.title || `Goal ${goal.id}`).join(', ');
    debugInfo += `\n\n(Debug: I see ${goals.length} goal(s): ${goalTitles})`;
  }
  if (tasks?.length) {
    const taskTitles = tasks.map(task => task.title || `Task ${task.id}`).join(', ');
    debugInfo += `\n\n(Debug: I see ${tasks.length} task(s): ${taskTitles})`;
  }

  const prompts: Record<string, string> = {
    goal_planning: `As an AI assistant helping ${profile.name} (Level ${profile.level}), analyze their goal and create an actionable plan. Consider their skills (${profile.skills.join(", ")}) and current tasks. Break down the goal into specific, achievable steps. Focus on practical actions and available resources.${debugInfo}`,
    
    task_help: `You're assisting ${profile.name} with their current task. Consider their goal context, skill level (${profile.level}), and previous progress. Provide specific, actionable advice that moves them forward. Include relevant resources or techniques based on their skills (${profile.skills.join(", ")}).${debugInfo}`,
    
    progress_review: `Review ${profile.name}'s progress on their goals and tasks. Acknowledge achievements, identify challenges, and suggest next steps. Consider their level (${profile.level}) and skills. Provide constructive feedback and specific recommendations for improvement.${debugInfo}`,
    
    resource_suggestion: `Based on ${profile.name}'s goals, tasks, and interests (${profile.interests.join(", ")}), recommend relevant resources, tools, or approaches. Consider their skill level (${profile.level}) and prioritize practical, accessible options.${debugInfo}`,
    
    motivation_boost: `Craft an encouraging message for ${profile.name} that acknowledges their progress (Level ${profile.level}) and current challenges. Reference their specific goals and achievements. Provide actionable steps to maintain momentum.${debugInfo}`,

    daily_planning: `Help ${profile.name} plan their day effectively. Consider their high-priority tasks, ongoing goals, and skill level (${profile.level}). Suggest a balanced approach that makes meaningful progress while remaining achievable.${debugInfo}`,

    skill_development: `Guide ${profile.name} in developing skills relevant to their goals. Consider their current level (${profile.level}), existing skills (${profile.skills.join(", ")}), and immediate objectives. Suggest specific learning resources and practice activities.${debugInfo}`,

    goal_reflection: `Help ${profile.name} reflect on their goals and progress. Consider their interests (${profile.interests.join(", ")}), current level (${profile.level}), and achievements. Guide them in adjusting or refining their objectives based on their experience.${debugInfo}`
  };

  return prompts[scenario] || prompts.daily_planning;
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function generateInterestingSuggestion(context: UserContext): string {
  const { dbUser, goals, tasks } = context;
  const name = dbUser?.first_name || dbUser?.telegram_username || 'there';

  // Debug info about goals and tasks
  let debugInfo = '';
  if (goals?.length) {
    const goalTitles = goals.map(goal => goal.title || `Goal ${goal.id}`).join(', ');
    debugInfo += `\n\n(Debug: I see ${goals.length} goal(s): ${goalTitles})`;
  }
  if (tasks?.length) {
    const taskTitles = tasks.map(task => task.title || `Task ${task.id}`).join(', ');
    debugInfo += `\n\n(Debug: I see ${tasks.length} task(s): ${taskTitles})`;
  }

  if (!goals || !tasks) return `Let's start by setting some goals for you. What would you like to achieve?${debugInfo}`;

  const activeGoals = goals.filter(goal => goal.status !== 'completed');
  const pendingTasks = tasks.filter(task => task.status !== 'completed');

  if (activeGoals.length === 0) {
    return `Would you like to set some goals? I can help you create a plan to achieve them.${debugInfo}`;
  }

  if (pendingTasks.length === 0) {
    return `Great job on keeping up with your tasks! Would you like to take on new challenges?${debugInfo}`;
  }

  return `I'm here to help you make progress on your goals. What would you like to focus on today?${debugInfo}`;
} 