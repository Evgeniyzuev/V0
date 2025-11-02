import { MapPin, Target, Trophy, Star, ChevronUp } from "lucide-react"

interface RoadmapPoint {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
  current?: boolean
}

export default function Roadmap() {
  const roadmapPoints: RoadmapPoint[] = [
    {
      id: "1",
      title: "Начало пути",
      description: "Определите свои первые цели",
      icon: <MapPin className="w-5 h-5" />,
      completed: true
    },
    {
      id: "2", 
      title: "Первые достижения",
      description: "Выполните 3 задачи",
      icon: <Target className="w-5 h-5" />,
      completed: true
    },
    {
      id: "3",
      title: "Следующий уровень",
      description: "Создайте план развития",
      icon: <Trophy className="w-5 h-5" />,
      completed: false,
      current: true
    },
    {
      id: "4",
      title: "Мастерство",
      description: "Достигните продвинутых навыков",
      icon: <Star className="w-5 h-5" />,
      completed: false
    }
  ]

  return (
    <div className="relative h-full bg-gradient-to-b from-purple-50 to-white overflow-hidden">
      {/* Фоновая сетка для эффекта навигатора */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: 'linear-gradient(0deg, #000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
      </div>

      {/* Контейнер маршрута */}
      <div className="relative h-full flex flex-col justify-between py-8">
        {/* Верхняя точка маршрута - следующий уровень */}
        <div className="flex flex-col items-center px-4">
          <div className="relative">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full" />
          </div>
          <div className="mt-3 text-center">
            <h3 className="font-semibold text-purple-900">Следующий уровень</h3>
            <p className="text-sm text-gray-600 mt-1">Создайте план развития</p>
          </div>
        </div>

        {/* Вертикальная линия маршрута */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-24 bottom-24 w-1 bg-gradient-to-b from-purple-400 via-purple-300 to-purple-200" />

        {/* Промежуточные точки */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-1/3 space-y-32">
          {roadmapPoints.slice(1, 3).map((point, index) => (
            <div key={point.id} className="relative">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
                point.completed ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {point.icon}
              </div>
              <div className="absolute left-16 top-1/2 transform -translate-y-1/2 w-32">
                <p className={`text-sm font-medium ${
                  point.completed ? 'text-green-700' : 'text-gray-500'
                }`}>
                  {point.title}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Указатель местоположения внизу */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {/* Тень указателя */}
            <div className="absolute inset-0 bg-purple-400 rounded-full blur-xl opacity-30 scale-150" />
            
            {/* Основной указатель */}
            <div className="relative w-20 h-20 bg-gradient-to-b from-purple-600 to-purple-700 rounded-full flex items-center justify-center shadow-2xl">
              <ChevronUp className="w-10 h-10 text-white animate-bounce" />
            </div>
            
            {/* Внутренний круг для эффекта */}
            <div className="absolute inset-2 bg-white rounded-full opacity-20" />
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm font-semibold text-purple-900">Ваше местоположение</p>
            <p className="text-xs text-gray-600 mt-1">Двигайтесь вверх к цели</p>
          </div>

          {/* Индикатор прогресса */}
          <div className="mt-4 w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full" />
          </div>
          <p className="text-xs text-gray-500 mt-1">75% завершено</p>
        </div>
      </div>

      {/* Боковые маркеры расстояния */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 space-y-8">
        <div className="text-xs text-gray-400">100м</div>
        <div className="text-xs text-gray-400">200м</div>
        <div className="text-xs text-gray-400">300м</div>
      </div>

      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 space-y-8">
        <div className="text-xs text-gray-400">500м</div>
        <div className="text-xs text-gray-400">600м</div>
        <div className="text-xs text-gray-400">700м</div>
      </div>
    </div>
  )
}

