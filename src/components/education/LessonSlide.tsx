import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Circle, Target, Lightbulb, HelpCircle, BookOpen } from "lucide-react";
import { EducationSlide } from "@/hooks/useEducationContent";

interface LessonSlideProps {
  slide: EducationSlide;
  isActive: boolean;
}

const slideTypeIcons = {
  content: BookOpen,
  quiz: HelpCircle,
  scenario: Lightbulb,
  action: Target
};

const slideTypeColors = {
  content: "text-blue-600 bg-blue-50",
  quiz: "text-purple-600 bg-purple-50",
  scenario: "text-green-600 bg-green-50",
  action: "text-orange-600 bg-orange-50"
};

export const LessonSlide = ({ slide, isActive }: LessonSlideProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleQuizAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowResult(true);
  };

  const Icon = slideTypeIcons[slide.slide_type];
  const colorClass = slideTypeColors[slide.slide_type];

  if (!isActive) return null;

  return (
    <div className="h-full flex flex-col justify-center p-6 animate-fade-in">
      {/* Slide Type Indicator */}
      <div className="flex justify-center mb-6">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${colorClass}`}>
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium capitalize">{slide.slide_type}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-4 leading-tight">{slide.title}</h2>
        
        {slide.image_url && (
          <div className="mb-6">
            <img 
              src={slide.image_url} 
              alt={slide.title}
              className="w-full max-w-md mx-auto rounded-lg shadow-md"
            />
          </div>
        )}
        
        <p className="text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
          {slide.content}
        </p>
      </div>

      {/* Quiz Content */}
      {slide.slide_type === 'quiz' && slide.quiz_options && (
        <div className="max-w-lg mx-auto w-full">
          <div className="space-y-3">
            {slide.quiz_options.options.map((option, index) => {
              let buttonClass = "w-full p-4 text-left border-2 transition-all duration-200 ";
              
              if (showResult) {
                if (index === slide.quiz_options!.correct) {
                  buttonClass += "border-green-500 bg-green-50 text-green-700";
                } else if (index === selectedAnswer && index !== slide.quiz_options!.correct) {
                  buttonClass += "border-red-500 bg-red-50 text-red-700";
                } else {
                  buttonClass += "border-gray-200 text-muted-foreground";
                }
              } else {
                buttonClass += "border-gray-200 hover:border-primary hover:bg-accent";
              }

              return (
                <Button
                  key={index}
                  variant="ghost"
                  className={buttonClass}
                  onClick={() => !showResult && handleQuizAnswer(index)}
                  disabled={showResult}
                >
                  <div className="flex items-center gap-3">
                    {showResult ? (
                      index === slide.quiz_options!.correct ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                    <span>{option}</span>
                  </div>
                </Button>
              );
            })}
          </div>
          
          {showResult && (
            <div className="mt-6 text-center">
              <div className={`p-4 rounded-lg ${
                selectedAnswer === slide.quiz_options.correct 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {selectedAnswer === slide.quiz_options.correct ? (
                  <span className="font-medium">🎉 Correct! Well done!</span>
                ) : (
                  <span className="font-medium">Not quite right. The correct answer is highlighted above.</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action/Scenario Styling */}
      {(slide.slide_type === 'action' || slide.slide_type === 'scenario') && (
        <Card className="max-w-lg mx-auto mt-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${colorClass} mb-4`}>
                <Icon className="h-5 w-5" />
                <span className="font-medium">
                  {slide.slide_type === 'action' ? 'Take Action!' : 'Real Example'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground italic">
                {slide.slide_type === 'action' 
                  ? "Try applying this knowledge to your investment journey"
                  : "Here's how this concept works in practice"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};