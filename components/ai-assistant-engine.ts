// TODO: AIAssistantEngine — архитектура и сценарии работы ИИ-ассистента WeAi
//
// 1. Сценарий развития диалога:
//    - Ассистент ведёт диалог, запоминая историю и контекст пользователя.
//    - На каждом этапе может запрашивать скрытую информацию из user context (цели, задачи, имя и т.д.) через системный промпт.
//    - Может сам инициировать вопросы, если не хватает данных.
//    - Сценарии: приветствие, уточнение целей, советы, напоминания, анализ прогресса, мотивация, помощь по задачам.
//    - Вся логика сценариев и переходов централизована и расширяема (state machine или сценарные функции).
//
// 2. Архитектура:
//    - Вынести всю работу с ИИ (генерация промптов, обработка ответов, сценарии) в этот компонент.
//    - Управление сценарием (state machine или сценарные функции).
//    - Формирование системного промпта с подстановкой данных из user context.
//    - Интерфейс для запроса информации у пользователя, если данных не хватает.
//    - Возможность расширять сценарии (новые этапы, ветвления).
//
// 3. Интеграция:
//    - UI-компонент (AIAssistantTab) только отображает сообщения и отправляет пользовательский ввод в движок.
//    - AIAssistantEngine возвращает готовые сообщения для UI и управляет состоянием диалога.
//
// 4. Примеры сценариев:
//    - Приветствие с учётом контекста (имя, цели, задачи).
//    - Если целей нет — предложить создать.
//    - Если есть незавершённые задачи — предложить выбрать, с чего начать.
//    - Анализировать хватает ли данных для ответа, если нет — запросить их скрыто через системный промпт.
//    - Давать советы, напоминания, анализировать прогресс.
//    - Легко добавлять новые сценарии и этапы.
//
// 5. Системный промпт:
//    - Всегда содержит актуальный user context (цели, задачи, прогресс, интересы и т.д.), но пользователь этого не видит.
//    - Используется для генерации релевантных и персонализированных ответов.
//
// 6. Пример API:
//    - init(userContext): инициализация движка с user context
//    - handleUserMessage(message): обработка пользовательского сообщения, возвращает ответ ассистента
//    - getCurrentScenarioState(): получить текущее состояние сценария
//    - reset(): сбросить сценарий и историю

// --- Ниже заготовка для будущей реализации ---

export interface AIAssistantEngineOptions {
  userContext: any; // { dbUser, goals, tasks, ... }
}

export class AIAssistantEngine {
  private userContext: any;
  private scenarioState: any;
  private chatHistory: { sender: string; text: string; timestamp: string }[] = [];

  constructor(options: AIAssistantEngineOptions) {
    this.userContext = options.userContext;
    this.scenarioState = { step: 'init' };
  }

  // Инициализация/сброс движка
  public reset(userContext?: any) {
    if (userContext) this.userContext = userContext;
    this.scenarioState = { step: 'init' };
    this.chatHistory = [];
  }

  // Получить текущее состояние сценария
  public getCurrentScenarioState() {
    return this.scenarioState;
  }

  // Генерация приветственного сообщения с учётом user context и daily context
  public generateWelcomeMessage(dailyContext?: {
    isFirstVisitToday?: boolean;
    lastVisitTimestamp?: string;
    completedTodayTasks?: number;
    pendingHighPriorityTasks?: number;
  }): string {
    const { dbUser, goals, tasks } = this.userContext || {};
    const userGoals = goals || [];
    const userTasks = tasks || [];
    const name = dbUser?.first_name || dbUser?.telegram_username || 'друг';

    // Если dailyContext есть, можно добавить особые приветствия
    if (dailyContext) {
      if (dailyContext.isFirstVisitToday) {
        return `С возвращением, ${name}! Готов помочь тебе сегодня.`;
      }
      // Можно добавить больше условий на основе dailyContext
    }

    if (userGoals.length > 0) {
      const activeGoals = userGoals.filter((goal: any) => goal.status !== 'completed');
      if (activeGoals.length > 0) {
        const goalTitles = activeGoals.map((goal: any) =>
          `"${goal.title || goal.goal?.title || `Цель ${goal.id}`}"`
        ).join(', ');
        return `Привет, ${name}! Ты работаешь над целями: ${goalTitles}. Чем могу помочь продвинуться сегодня?`;
      }
    }
    if (userTasks.length > 0) {
      const pendingTasks = userTasks.filter((task: any) => task.status !== 'completed');
      if (pendingTasks.length > 0) {
        return `Привет, ${name}! У тебя ${pendingTasks.length} незавершённых задач. С чего начнём?`;
      }
    }
    return `Привет, ${name}! Я твой ИИ-ассистент. Давай поставим для тебя значимые цели. Чего хочешь достичь?`;
  }

  // Генерация системного промпта для LLM (скрытый от пользователя)
  public generateSystemPrompt(): string {
    const { dbUser, goals, tasks } = this.userContext || {};
    let prompt = `Контекст пользователя:
Имя: ${dbUser?.first_name || dbUser?.telegram_username || 'Пользователь'}
Уровень: ${dbUser?.level || 'не указан'}
Целей: ${goals?.length || 0}
Задач: ${tasks?.length || 0}
`;

    if (goals && goals.length > 0) {
      prompt += `\nСписок целей:\n`;
      for (const goal of goals) {
        prompt += `- ${goal.title || goal.goal?.title || 'Без названия'} (статус: ${goal.status}, сложность: ${goal.difficulty_level || 'не указана'})\n`;
      }
    }

    if (tasks && tasks.length > 0) {
      prompt += `\nСписок задач:\n`;
      for (const task of tasks) {
        prompt += `- ${task.title || task.task?.title || 'Без названия'} (статус: ${task.status})\n`;
      }
    }

    return prompt;
  }

  // Основной метод обработки пользовательского сообщения и сценариев
  public async handleUserMessage(message: string): Promise<string> {
    // Пример простого сценария: если целей нет — предложить создать, если есть задачи — предложить выбрать и т.д.
    const { goals, tasks } = this.userContext || {};
    if (!goals || goals.length === 0) {
      return 'У тебя пока нет целей. Хочешь создать первую цель?';
    }
    const pendingTasks = (tasks || []).filter((task: any) => task.status !== 'completed');
    if (pendingTasks.length > 0) {
      return `У тебя ${pendingTasks.length} незавершённых задач. С какой начнём? Или задай вопрос!`;
    }
    // TODO: Здесь можно добавить вызов LLM с системным промптом и историей чата
    return 'Спасибо за сообщение! Я готов помочь с твоими целями и задачами.';
  }

  // Вспомогательные методы для генерации промптов, анализа контекста и т.д.
  // ...
} 