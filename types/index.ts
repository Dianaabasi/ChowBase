export interface Profile {
  id: string;
  email: string;
  is_pro: boolean;
  is_verified: boolean;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  preferences: string[] | null;
  has_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipeStep {
  id: string;
  recipe_id: string;
  step_number: number;
  instruction: string;
  timer_secs: number | null;
  created_at: string;
}

export interface Ingredient {
  id: string;
  recipe_id: string;
  ingredient_name: string;
  amount: number | null;
  unit: string | null;
  market_section: string | null;
}

export interface Recipe {
  id: string;
  author_id: string;
  title: string;
  description: string;
  category: string;
  card_type: 'standard' | 'video' | 'carousel';
  image_url: string;
  video_url: string | null;
  kcal: number;
  healthy_score: number;
  prep_time_mins: number;
  cook_time_mins: number;
  sapa_mode: boolean;
  status: 'draft' | 'published';
  is_featured: boolean;
  created_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
  likes?: { count: number }[];
  recipe_steps?: RecipeStep[];
  recipe_ingredients?: Ingredient[];
}

export interface Comment {
  id: string;
  user_id: string;
  recipe_id: string;
  content: string;
  is_flagged: boolean;
  created_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

export interface GroceryItem {
  id: string;
  user_id: string;
  ingredient_id: string | null;
  recipe_id: string | null;
  name: string;
  amount: number | null;
  unit: string | null;
  market_section: string | null;
  is_checked: boolean;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}
