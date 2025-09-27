import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EducationCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  order_index: number;
}

export interface EducationLesson {
  id: string;
  category_id: string;
  title: string;
  description: string;
  estimated_time: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  order_index: number;
}

export interface EducationSlide {
  id: string;
  lesson_id: string;
  title: string;
  content: string;
  slide_type: 'content' | 'quiz' | 'scenario' | 'action';
  image_url?: string | null;
  quiz_options?: any;
  order_index: number;
}

export const useEducationCategories = () => {
  return useQuery({
    queryKey: ["education-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("education_categories")
        .select("*")
        .order("order_index");

      if (error) throw error;
      return data as EducationCategory[];
    },
  });
};

export const useEducationLessons = (categoryId: string) => {
  return useQuery({
    queryKey: ["education-lessons", categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("education_lessons")
        .select("*")
        .eq("category_id", categoryId)
        .order("order_index");

      if (error) throw error;
      return data as EducationLesson[];
    },
  });
};

export const useEducationSlides = (lessonId: string) => {
  return useQuery({
    queryKey: ["education-slides", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("education_slides")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("order_index");

      if (error) throw error;
      return data as EducationSlide[];
    },
  });
};

export const useEducationLesson = (lessonId: string) => {
  return useQuery({
    queryKey: ["education-lesson", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("education_lessons")
        .select("*")
        .eq("id", lessonId)
        .single();

      if (error) throw error;
      return data as EducationLesson;
    },
  });
};