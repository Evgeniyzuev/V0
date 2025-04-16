import { AIAssistantContext } from "@/types/user-context";

interface DailyContext {
  isFirstVisitToday: boolean;
  lastVisitTimestamp?: string;
  completedTodayTasks: number;
  pendingHighPriorityTasks: number;
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

Remember: Your goal is to help users achieve real progress while building a sustainable, supportive system for all.`;
}

export function generateDailyGreeting(context: AIAssistantContext, dailyContext: DailyContext): string {
  const { profile, goals, tasks } = context;
  const { isFirstVisitToday, lastVisitTimestamp, completedTodayTasks, pendingHighPriorityTasks } = dailyContext;

  if (!isFirstVisitToday) return "";

  let greeting = `Good ${getTimeOfDay()}${profile.name ? `, ${profile.name}` : ""}! `;

  // If they have completed tasks today
  if (completedTodayTasks > 0) {
    greeting += `Great job completing ${completedTodayTasks} ${completedTodayTasks === 1 ? "task" : "tasks"} today! `;
  }

  // If they have high priority tasks
  if (pendingHighPriorityTasks > 0) {
    greeting += `You have ${pendingHighPriorityTasks} high-priority ${pendingHighPriorityTasks === 1 ? "task" : "tasks"} to focus on. `;
  }

  // If they have active goals
  const activeGoals = goals.filter(g => g.progress_percentage < 100);
  if (activeGoals.length > 0) {
    const nextGoal = activeGoals[0];
    greeting += `Let's make progress on your goal: "${nextGoal.title}". `;
  }

  return greeting;
}

export function generateContextBasedPrompt(context: AIAssistantContext, scenario: string): string {
  const { profile, goals, tasks } = context;

  const prompts: Record<string, string> = {
    goal_planning: `As an AI assistant helping ${profile.name} (Level ${profile.level}), analyze their goal and create an actionable plan. Consider their skills (${profile.skills.join(", ")}) and current tasks. Break down the goal into specific, achievable steps. Focus on practical actions and available resources.`,
    
    task_help: `You're assisting ${profile.name} with their current task. Consider their goal context, skill level (${profile.level}), and previous progress. Provide specific, actionable advice that moves them forward. Include relevant resources or techniques based on their skills (${profile.skills.join(", ")}).`,
    
    progress_review: `Review ${profile.name}'s progress on their goals and tasks. Acknowledge achievements, identify challenges, and suggest next steps. Consider their level (${profile.level}) and skills. Provide constructive feedback and specific recommendations for improvement.`,
    
    resource_suggestion: `Based on ${profile.name}'s goals, tasks, and interests (${profile.interests.join(", ")}), recommend relevant resources, tools, or approaches. Consider their skill level (${profile.level}) and prioritize practical, accessible options.`,
    
    motivation_boost: `Craft an encouraging message for ${profile.name} that acknowledges their progress (Level ${profile.level}) and current challenges. Reference their specific goals and achievements. Provide actionable steps to maintain momentum.`,

    daily_planning: `Help ${profile.name} plan their day effectively. Consider their high-priority tasks, ongoing goals, and skill level (${profile.level}). Suggest a balanced approach that makes meaningful progress while remaining achievable.`,

    skill_development: `Guide ${profile.name} in developing skills relevant to their goals. Consider their current level (${profile.level}), existing skills (${profile.skills.join(", ")}), and immediate objectives. Suggest specific learning resources and practice activities.`,

    goal_reflection: `Help ${profile.name} reflect on their goals and progress. Consider their interests (${profile.interests.join(", ")}), current level (${profile.level}), and achievements. Guide them in adjusting or refining their objectives based on their experience.`
  };

  return prompts[scenario] || prompts.daily_planning;
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function generateInterestingSuggestion(context: AIAssistantContext): string {
  const { profile, goals, tasks } = context;

  // If user has no goals yet
  if (goals.length === 0) {
    return `Based on your interests in ${profile.interests.join(", ")}, would you like to explore some popular goals that others with similar interests are working on?`;
  }

  // If user has goals but no recent progress
  const activeGoals = goals.filter(g => g.progress_percentage < 100);
  if (activeGoals.length > 0) {
    const stuckGoals = activeGoals.filter(g => {
      const relatedTasks = tasks.filter(t => t.goalId === g.id);
      return relatedTasks.every(t => t.status !== 'IN_PROGRESS');
    });

    if (stuckGoals.length > 0) {
      return `I notice you haven't made progress on "${stuckGoals[0].title}" recently. Would you like to explore some new approaches or break this down into smaller steps?`;
    }
  }

  // If user is making good progress
  const completedTasks = tasks.filter(t => t.status === 'DONE');
  if (completedTasks.length > 0) {
    return `You're making great progress! Based on your completed tasks, would you like to explore some more advanced goals in ${profile.interests[0]}?`;
  }

  return `I see you're interested in ${profile.interests.join(", ")}. Would you like to discover some exciting opportunities in these areas?`;
} 