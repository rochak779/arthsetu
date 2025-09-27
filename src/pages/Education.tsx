import { useNavigate } from "react-router-dom";
import { useEducationCategories } from "@/hooks/useEducationContent";
import { EducationCard } from "@/components/education/EducationCard";
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
    return <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto p-4">
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({
            length: 6
          }).map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
        <BottomTabBar />
      </div>;
  }
  return <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">ArthSetu Academy</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Master the fundamentals of investing with our interactive lessons
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-card rounded-lg border">
            <div className="text-2xl font-bold text-primary">{categories?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </div>
          <div className="text-center p-4 bg-card rounded-lg border">
            <div className="text-2xl font-bold text-primary">25+</div>
            <div className="text-sm text-muted-foreground">Lessons</div>
          </div>
          <div className="text-center p-4 bg-card rounded-lg border">
            <div className="text-2xl font-bold text-primary">150+</div>
            <div className="text-sm text-muted-foreground">Slides</div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {categories?.map(category => <EducationCard key={category.id} title={category.title} description={category.description} icon={category.icon} color={category.color} type="category" onClick={() => navigate(`/education/category/${category.id}`)} />)}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border">
          <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Start Your Learning Journey</h3>
          <p className="text-muted-foreground mb-4">
            Begin with the basics and progress to advanced investment strategies
          </p>
          <div className="text-sm text-muted-foreground">
            📚 Interactive lessons • 🧠 Quizzes • 💡 Real examples • 🎯 Action items
          </div>
        </div>
      </div>
      
      <BottomTabBar />
    </div>;
};
export default Education;