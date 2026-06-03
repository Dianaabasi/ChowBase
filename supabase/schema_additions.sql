-- ==============================================================================
-- ChowBase: Supplemental Schema Additions
-- Run this in your Supabase SQL Editor
-- This script is completely idempotent and safe to run multiple times.
-- ==============================================================================

-- 1. Create Comments Table if it doesn't exist at all
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid default gen_random_uuid() primary key,
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  is_flagged boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Safely handle column renames if the table was previously created with ARCHITECTURE.md specs
DO $$
BEGIN
  -- Rename author_id to user_id if author_id exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='comments' AND column_name='author_id') THEN
    ALTER TABLE public.comments RENAME COLUMN author_id TO user_id;
  END IF;
  
  -- Rename body to content if body exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='comments' AND column_name='body') THEN
    ALTER TABLE public.comments RENAME COLUMN body TO content;
  END IF;
END $$;

-- Enable RLS for Comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone." ON public.comments;
CREATE POLICY "Comments are viewable by everyone." ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own comments." ON public.comments;
CREATE POLICY "Users can insert their own comments." ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments." ON public.comments;
CREATE POLICY "Users can delete own comments." ON public.comments FOR DELETE USING (auth.uid() = user_id);


-- 2. Create Grocery Lists / Items (matches types/index.ts)
CREATE TABLE IF NOT EXISTS public.grocery_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  ingredient_id uuid, -- Optional reference to specific ingredient
  recipe_id uuid references public.recipes(id) on delete cascade,
  name text not null,
  amount numeric,
  unit text,
  market_section text default 'general',
  is_checked boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Grocery Items
ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own grocery items." ON public.grocery_items;
CREATE POLICY "Users can manage own grocery items." ON public.grocery_items FOR ALL USING (auth.uid() = user_id);

-- 3. Create Follows Table
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  PRIMARY KEY (follower_id, following_id)
);

-- Enable RLS for Follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Follows are viewable by everyone." ON public.follows;
CREATE POLICY "Follows are viewable by everyone." ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own follows." ON public.follows;
CREATE POLICY "Users can insert their own follows." ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can delete own follows." ON public.follows;
CREATE POLICY "Users can delete own follows." ON public.follows FOR DELETE USING (auth.uid() = follower_id);


-- Dynamic Categories Table
DROP TABLE IF EXISTS recipe_categories;

CREATE TABLE recipe_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert defaults if not exists
INSERT INTO recipe_categories (name, is_default) 
VALUES 
('Nigerian Soups', true),
('Rice Dishes', true),
('Snacks & Pastries', true),
('Vegan / Plant-Based', true),
('Meat Lovers', true),
('Healthy & Diet', true)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS and add policies
ALTER TABLE recipe_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read categories" ON recipe_categories;
CREATE POLICY "Anyone can read categories" ON recipe_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create custom categories" ON recipe_categories;
CREATE POLICY "Authenticated users can create custom categories" ON recipe_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');

