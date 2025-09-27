import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEducationLesson, useEducationSlides } from "@/hooks/useEducationContent";
import { SwipeableContainer } from "@/components/education/SwipeableContainer";
import { LessonSlide } from "@/components/education/LessonSlide";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const EducationLesson = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const { data: lesson, isLoading: lessonLoading } = useEducationLesson(lessonId!);
  const { data: slides, isLoading: slidesLoading } = useEducationSlides(lessonId!);

  const isLoading = lessonLoading || slidesLoading;

  const handleLessonComplete = () => {
    toast({
      title: "Lesson completed! 🎉",
      description: `You've finished "${lesson?.title}". Great job learning!`,
    });
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-32 mx-auto mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-64 w-96 mx-auto" />
            <div className="flex gap-2 justify-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-2 w-2 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson || !slides || slides.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Lesson not found</h2>
          <p className="text-muted-foreground mb-6">
            This lesson doesn't exist or has no content yet.
          </p>
          <Button onClick={() => navigate("/education")}>
            Back to Education
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SwipeableContainer
      currentIndex={currentSlideIndex}
      onIndexChange={setCurrentSlideIndex}
      onComplete={handleLessonComplete}
    >
      {slides.map((slide) => (
        <LessonSlide
          key={slide.id}
          slide={slide}
          isActive={slides[currentSlideIndex]?.id === slide.id}
        />
      ))}
    </SwipeableContainer>
  );
};

export default EducationLesson;