-- Create education categories table
CREATE TABLE public.education_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create education lessons table
CREATE TABLE public.education_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.education_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_time INTEGER NOT NULL, -- in minutes
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create education slides table
CREATE TABLE public.education_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.education_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  slide_type TEXT NOT NULL DEFAULT 'content' CHECK (slide_type IN ('content', 'quiz', 'scenario', 'action')),
  image_url TEXT,
  quiz_options JSONB, -- For quiz slides: {"question": "...", "options": ["A", "B", "C"], "correct": 0}
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (make content publicly readable)
ALTER TABLE public.education_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_slides ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Education categories are publicly readable" 
ON public.education_categories FOR SELECT USING (true);

CREATE POLICY "Education lessons are publicly readable" 
ON public.education_lessons FOR SELECT USING (true);

CREATE POLICY "Education slides are publicly readable" 
ON public.education_slides FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX idx_education_lessons_category_id ON public.education_lessons(category_id);
CREATE INDEX idx_education_slides_lesson_id ON public.education_slides(lesson_id);
CREATE INDEX idx_education_categories_order ON public.education_categories(order_index);
CREATE INDEX idx_education_lessons_order ON public.education_lessons(order_index);
CREATE INDEX idx_education_slides_order ON public.education_slides(order_index);

-- Insert sample education content
INSERT INTO public.education_categories (title, description, icon, color, order_index) VALUES
('Stock Market Basics', 'Learn the fundamentals of how the stock market works', '📈', 'hsl(220, 91%, 60%)', 1),
('Trading Fundamentals', 'Understand buying, selling, and trading strategies', '💹', 'hsl(142, 76%, 36%)', 2),
('Investment Strategies', 'Discover different approaches to investing', '🎯', 'hsl(262, 83%, 58%)', 3),
('Risk Management', 'Learn to protect and manage your investments', '🛡️', 'hsl(25, 95%, 53%)', 4),
('Portfolio Building', 'Build and maintain a diversified portfolio', '📊', 'hsl(173, 58%, 39%)', 5);

-- Insert sample lessons for Stock Market Basics
INSERT INTO public.education_lessons (category_id, title, description, estimated_time, difficulty, order_index)
SELECT 
  c.id,
  lesson.title,
  lesson.description,
  lesson.estimated_time,
  lesson.difficulty,
  lesson.order_index
FROM public.education_categories c,
(VALUES 
  ('What is the Stock Market?', 'Understanding the basics of stock markets and how they work', 8, 'beginner', 1),
  ('How Stocks Work', 'Learn what stocks represent and how they gain or lose value', 10, 'beginner', 2),
  ('Market Hours & Trading', 'When markets are open and how trading happens', 6, 'beginner', 3),
  ('Bulls vs Bears', 'Understanding market trends and investor sentiment', 7, 'beginner', 4)
) AS lesson(title, description, estimated_time, difficulty, order_index)
WHERE c.title = 'Stock Market Basics';

-- Insert sample lessons for Trading Fundamentals
INSERT INTO public.education_lessons (category_id, title, description, estimated_time, difficulty, order_index)
SELECT 
  c.id,
  lesson.title,
  lesson.description,
  lesson.estimated_time,
  lesson.difficulty,
  lesson.order_index
FROM public.education_categories c,
(VALUES 
  ('Buy, Hold, Sell Strategies', 'Learn the three fundamental trading actions', 12, 'beginner', 1),
  ('Market vs Limit Orders', 'Understanding different types of trade orders', 9, 'intermediate', 2),
  ('Reading Stock Charts', 'Basic chart analysis and price patterns', 15, 'intermediate', 3),
  ('Understanding Volume', 'How trading volume affects stock prices', 8, 'intermediate', 4)
) AS lesson(title, description, estimated_time, difficulty, order_index)
WHERE c.title = 'Trading Fundamentals';

-- Insert sample slides for "What is the Stock Market?" lesson
INSERT INTO public.education_slides (lesson_id, title, content, slide_type, order_index, quiz_options)
SELECT 
  l.id,
  slide.title,
  slide.content,
  slide.slide_type,
  slide.order_index,
  slide.quiz_options::jsonb
FROM public.education_lessons l,
(VALUES 
  ('Welcome to Stock Market Basics! 📈', 'Let''s start your journey into understanding how the stock market works. By the end of this lesson, you''ll know what stocks are and why people trade them.', 'content', 1, NULL),
  ('What is a Stock Market?', 'A stock market is like a giant marketplace where people buy and sell pieces of companies called "stocks" or "shares". Just like you might sell your old bike to someone who wants it, companies sell parts of their business to people who believe the company will grow.', 'content', 2, NULL),
  ('Why Do Companies Sell Stocks?', 'Companies sell stocks to raise money for growth. Instead of taking a loan from a bank, they sell pieces of their company to many people. This gives them money to expand, hire more people, or develop new products.', 'content', 3, NULL),
  ('Quick Check! 🧠', 'What is the main reason companies sell stocks?', 'quiz', 4, '{"question": "What is the main reason companies sell stocks?", "options": ["To make friends", "To raise money for growth", "To reduce their workforce", "To close the business"], "correct": 1}'),
  ('Who Buys Stocks?', 'Anyone can buy stocks! This includes individual people like you and me (called retail investors), large institutions like pension funds, and professional money managers. When you buy a stock, you become a part-owner of that company.', 'content', 5, NULL),
  ('Stock Prices Go Up and Down', 'Stock prices change every second the market is open. They go up when more people want to buy than sell, and down when more people want to sell than buy. It''s like an auction where the price depends on demand.', 'content', 6, NULL),
  ('Your First Action Step! 🎯', 'Next time you see a company logo (like Apple, Google, or Coca-Cola), remember that you could own a tiny piece of that company by buying their stock. Start noticing which companies you interact with daily!', 'action', 7, NULL)
) AS slide(title, content, slide_type, order_index, quiz_options)
WHERE l.title = 'What is the Stock Market?';

-- Insert sample slides for "Buy, Hold, Sell Strategies" lesson
INSERT INTO public.education_slides (lesson_id, title, content, slide_type, order_index, quiz_options)
SELECT 
  l.id,
  slide.title,
  slide.content,
  slide.slide_type,
  slide.order_index,
  slide.quiz_options::jsonb
FROM public.education_lessons l,
(VALUES 
  ('The Three Trading Actions 💹', 'Every investor has three choices with any stock: Buy it, Hold it, or Sell it. Let''s explore when and why you might choose each action.', 'content', 1, NULL),
  ('BUY: When to Enter', 'You buy a stock when you believe it will increase in value. Look for companies with strong growth potential, good financial health, and reasonable prices. Remember: buy low, sell high!', 'content', 2, NULL),
  ('HOLD: The Patient Strategy', 'Holding means keeping your stocks for a long time. This strategy works well for quality companies that grow steadily over years. Many successful investors are patient holders who ignore short-term price swings.', 'content', 3, NULL),
  ('SELL: When to Exit', 'You might sell when: the stock reaches your target price, the company''s fundamentals change negatively, you need the money, or you want to invest in better opportunities.', 'content', 4, NULL),
  ('Strategy Quiz! 🤔', 'If you bought a stock for ₹100 and it''s now worth ₹150, but you believe it could reach ₹200, what should you do?', 'quiz', 5, '{"question": "If you bought a stock for ₹100 and it''s now worth ₹150, but you believe it could reach ₹200, what should you do?", "options": ["Sell immediately to lock in profit", "Hold if you believe in ₹200 target", "Buy more shares", "Panic and sell at a loss"], "correct": 1}'),
  ('Real Scenario: TCS Stock 📊', 'Imagine you bought TCS at ₹3000. After 6 months, it''s at ₹3500. The company just announced a major new contract. Based on buy-hold-sell principles, holding might be wise if you believe in long-term growth.', 'scenario', 6, NULL),
  ('Your Action Plan 🎯', 'Before buying any stock, decide your target sell price and maximum acceptable loss. Write it down! This removes emotion from your decisions and helps you stick to your strategy.', 'action', 7, NULL)
) AS slide(title, content, slide_type, order_index, quiz_options)
WHERE l.title = 'Buy, Hold, Sell Strategies';