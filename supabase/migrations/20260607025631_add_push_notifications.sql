-- Add push notification columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN expo_push_token TEXT,
ADD COLUMN push_enabled BOOLEAN DEFAULT false;
