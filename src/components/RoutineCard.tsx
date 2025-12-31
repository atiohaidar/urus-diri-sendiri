import type { RoutineItem } from '@/lib/storage';
import { Clock, Sparkles, Dumbbell, Apple, Target, Moon, BookOpen } from 'lucide-react';

interface RoutineCardProps {
  routine: RoutineItem;
  index: number;
}

const categoryIcons: Record<string, React.ReactNode> = {
  Mindfulness: <Sparkles className="w-4 h-4" />,
  Fitness: <Dumbbell className="w-4 h-4" />,
  Nutrition: <Apple className="w-4 h-4" />,
  Productivity: <Target className="w-4 h-4" />,
  Spiritual: <Moon className="w-4 h-4" />,
  Learning: <BookOpen className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  Mindfulness: 'bg-purple-100 text-purple-700',
  Fitness: 'bg-orange-100 text-orange-700',
  Nutrition: 'bg-green-100 text-green-700',
  Productivity: 'bg-blue-100 text-blue-700',
  Spiritual: 'bg-amber-100 text-amber-700',
  Learning: 'bg-pink-100 text-pink-700',
};

const RoutineCard = ({ routine, index }: RoutineCardProps) => {
  return (
    <div 
      className="bg-card rounded-3xl p-4 card-elevated animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{routine.time}</span>
            <span className="text-muted-foreground/50">•</span>
            <span>{routine.duration}</span>
          </div>
          <h3 className="font-semibold text-foreground">{routine.activity}</h3>
        </div>
        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${categoryColors[routine.category] || 'bg-muted text-muted-foreground'}`}>
          {categoryIcons[routine.category]}
          {routine.category}
        </span>
      </div>
    </div>
  );
};

export default RoutineCard;
