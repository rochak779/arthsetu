import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SwipeableContainerProps {
  children: React.ReactNode[];
  onComplete?: () => void;
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export const SwipeableContainer = ({ 
  children, 
  onComplete, 
  currentIndex, 
  onIndexChange 
}: SwipeableContainerProps) => {
  const navigate = useNavigate();
  const totalSlides = children.length;
  const progress = ((currentIndex + 1) / totalSlides) * 100;

  const handleNext = () => {
    if (currentIndex < totalSlides - 1) {
      onIndexChange(currentIndex + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  // Handle touch events for swipe gestures
  useEffect(() => {
    let startX: number;
    let startY: number;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const deltaX = startX - endX;
      const deltaY = startY - endY;

      // Only trigger swipe if horizontal movement is greater than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          // Swipe left - next slide
          handleNext();
        } else {
          // Swipe right - previous slide
          handlePrev();
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex, totalSlides]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalSlides]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50 relative overflow-hidden">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-10 w-10"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 mx-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} of {totalSlides}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          
          <div className="w-10" /> {/* Spacer for balance */}
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-20">
        <div className="container mx-auto">
          {children[currentIndex]}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => onIndexChange(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? 'bg-primary scale-125'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            className="flex items-center gap-2"
          >
            {currentIndex === totalSlides - 1 ? (
              "Complete"
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Swipe hint for first slide */}
      {currentIndex === 0 && (
        <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm animate-pulse">
            👆 Swipe or use arrow keys to navigate
          </div>
        </div>
      )}
    </div>
  );
};