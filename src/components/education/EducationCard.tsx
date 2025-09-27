import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Star } from "lucide-react";

interface EducationCardProps {
  title: string;
  description: string;
  icon?: string;
  color?: string;
  estimatedTime?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  onClick: () => void;
  type?: 'category' | 'lesson';
}

const difficultyColors = {
  beginner: "bg-green-100 text-green-800 border-green-200",
  intermediate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  advanced: "bg-red-100 text-red-800 border-red-200"
};

const difficultyIcons = {
  beginner: 1,
  intermediate: 2,
  advanced: 3
};

export const EducationCard = ({
  title,
  description,
  icon,
  color,
  estimatedTime,
  difficulty,
  onClick,
  type = 'category'
}: EducationCardProps) => {
  return (
    <Card 
      className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 hover:border-primary/50"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div 
                className="text-3xl p-2 rounded-lg"
                style={{ backgroundColor: color ? `${color.replace('hsl(', 'hsla(').replace(')', ', 0.1)')}` : undefined }}
              >
                {icon}
              </div>
            )}
            <div>
              <CardTitle className="text-lg font-semibold leading-tight">{title}</CardTitle>
              {difficulty && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={difficultyColors[difficulty]}>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: difficultyIcons[difficulty] }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-current" />
                      ))}
                      <span className="ml-1 capitalize">{difficulty}</span>
                    </div>
                  </Badge>
                </div>
              )}
            </div>
          </div>
          {estimatedTime && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              <span>{estimatedTime}m</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
};