import { useNavigate } from "react-router-dom";
import { useEducationCategories } from "@/hooks/useEducationContent";
import { EducationCard } from "@/components/education/EducationCard";
import { EducationChatbot } from "@/components/education/EducationChatbot";
import { Skeleton } from "@/components/ui/skeleton";
import BottomTabBar from "@/components/BottomTabBar";
import { GraduationCap, BookOpen } from "lucide-react";

const Education = () => {
  const navigate = useNavigate();
  const {
    data: categories,
    isLoading
  } = useEducationCategories();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto p-4">
          <div className="text-center mb-6">
            <Skeleton className="h-6 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto p-4">
        {/* Compact Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">ArthSetu Academy</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Master investing with interactive lessons
          </p>
        </div>

        {/* Compact Stats Section */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 bg-card rounded-lg border">
            <div className="text-xl font-bold text-primary">{categories?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Categories</div>
          </div>
          <div className="text-center p-3 bg-card rounded-lg border">
            <div className="text-xl font-bold text-primary">25+</div>
            <div className="text-xs text-muted-foreground">Lessons</div>
          </div>
          <div className="text-center p-3 bg-card rounded-lg border">
            <div className="text-xl font-bold text-primary">150+</div>
            <div className="text-xs text-muted-foreground">Slides</div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {categories?.map(category => (
            <EducationCard 
              key={category.id} 
              title={category.title} 
              description={category.description} 
              icon={category.icon} 
              color={category.color} 
              type="category" 
              onClick={() => navigate(`/education/category/${category.id}`)} 
            />
          ))}
        </div>

        {/* Compact Footer CTA */}
        <div className="mt-8 text-center p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border">
          <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="text-lg font-semibold mb-1">Start Learning</h3>
          <div className="text-xs text-muted-foreground">
            📚 Interactive • 🧠 Quizzes • 💡 Examples • 🎯 Actions
          </div>
        </div>
      </div>
      
      <EducationChatbot />
      <BottomTabBar />
    </div>
  );
};

export default Education;