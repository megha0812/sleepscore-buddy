-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create sleep_logs table
CREATE TABLE public.sleep_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  sleep_time TIMESTAMP WITH TIME ZONE NOT NULL,
  wake_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_hours DECIMAL(4,2) NOT NULL,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

-- Sleep logs policies
CREATE POLICY "Users can view their own sleep logs"
  ON public.sleep_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sleep logs"
  ON public.sleep_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sleep logs"
  ON public.sleep_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sleep logs"
  ON public.sleep_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Create rewards table
CREATE TABLE public.rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Rewards policies (everyone can view, only admins can modify)
CREATE POLICY "Anyone can view rewards"
  ON public.rewards FOR SELECT
  USING (true);

-- Create redeemed_rewards table
CREATE TABLE public.redeemed_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards ON DELETE CASCADE,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.redeemed_rewards ENABLE ROW LEVEL SECURITY;

-- Redeemed rewards policies
CREATE POLICY "Users can view their own redeemed rewards"
  ON public.redeemed_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own redeemed rewards"
  ON public.redeemed_rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_sleep_logs
  BEFORE UPDATE ON public.sleep_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert some mock rewards
INSERT INTO public.rewards (name, description, points_cost, icon) VALUES
  ('Sleep Champion Badge', 'Awarded for consistent sleep tracking', 50, '🏆'),
  ('Early Bird Badge', 'For waking up before 7 AM consistently', 75, '🌅'),
  ('Night Owl Recovery', 'For improving late sleep habits', 100, '🦉'),
  ('Week Warrior', 'Complete 7 days of logging', 150, '⚡'),
  ('Discount Voucher', 'Get 10% off sleep products', 200, '🎫');