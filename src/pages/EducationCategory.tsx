import { useParams, useNavigate } from "react-router-dom";
import { useEducationCategories, useEducationLessons } from "@/hooks/useEducationContent";
import { EducationCard } from "@/components/education/EducationCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BookOpen } from "lucide-react";

const EducationCategory = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { data: categories } = useEducationCategories();
  const { data: lessons, isLoading } = useEducationLessons(categoryId!);

  const category = categories?.find(cat => cat.id === categoryId);

  if (!category && !isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Category not found</h2>
          <Button onClick={() => navigate("/education")}>
            Back to Education
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4">
          <div className="mb-6">
            <Skeleton className="h-10 w-32 mb-4" />
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/education")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Categories
          </Button>
          
          {category && (
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="text-4xl p-3 rounded-xl"
                style={{ backgroundColor: category.color ? `${category.color.replace('hsl(', 'hsla(').replace(')', ', 0.1)')}` : undefined }}
              >
                {category.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{category.title}</h1>
                <p className="text-muted-foreground text-lg">{category.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Lessons List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Lessons ({lessons?.length || 0})</h2>
          </div>

          {lessons?.map((lesson, index) => (
            <EducationCard
              key={lesson.id}
              title={`${index + 1}. ${lesson.title}`}
              description={lesson.description}
              estimatedTime={lesson.estimated_time}
              difficulty={lesson.difficulty}
              type="lesson"
              onClick={() => navigate(`/education/lesson/${lesson.id}`)}
            />
          ))}

          {lessons?.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No lessons available</h3>
              <p className="text-muted-foreground">
                Lessons for this category are coming soon!
              </p>
            </div>
          )}
        </div>

        {/* Progress Overview */}
        {lessons && lessons.length > 0 && (
          <div className="mt-8 p-6 bg-card rounded-xl border">
            <h3 className="text-lg font-semibold mb-4">Learning Path</h3>
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <div key={lesson.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{lesson.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {lesson.estimated_time} minutes • {lesson.difficulty}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
              Total time: {lessons.reduce((acc, lesson) => acc + lesson.estimated_time, 0)} minutes
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EducationCategory;