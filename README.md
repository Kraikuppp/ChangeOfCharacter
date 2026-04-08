# CHocH - Change of Character

A Progressive Web App (PWA) for tracking calories, losing weight, exercising, and planning your health journey.

## Features

- 🔐 Authentication with email verification (Supabase)
- 📊 Health calculations: BMI, BMR, TDEE, Protein needs
- 📅 Calendar-based food and exercise tracking
- 📱 Responsive PWA design
- 🎯 Goal-based calorie targets

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [Supabase](https://supabase.com)
2. Copy your project URL and anon key
3. Create a `.env` file based on `.env.example`

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set up Database Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable RLS
alter table auth.users enable row level security;

-- Food logs table
CREATE TABLE IF NOT EXISTS food_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  name text NOT NULL,
  calories integer NOT NULL,
  protein numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Exercise logs table
CREATE TABLE IF NOT EXISTS exercise_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  name text NOT NULL,
  calories integer NOT NULL,
  duration integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Profiles table (optional, extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username text,
  gender text,
  weight numeric,
  height numeric,
  age integer,
  activity_level text,
  goal text,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add avatar_url column to profiles (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create RLS policies
CREATE POLICY "Users can only access their own food logs"
  ON food_logs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own exercise logs"
  ON exercise_logs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own profile"
  ON profiles FOR ALL
  USING (auth.uid() = id);
```

### 4. Create Storage Bucket for Avatars

In Supabase Dashboard → Storage:

1. Create a new bucket named `avatars`
2. Set it to **Public bucket** (enable public access)
3. Add RLS policy for uploads:

```sql
-- Allow users to upload their own avatars
CREATE POLICY "Anyone can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

-- Allow public access to view avatars
CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
```

### 5. Configure Email Templates

In Supabase Dashboard → Authentication → Templates:

1. **Confirm signup** template:
```html
<h2>Confirm your email</h2>
<p>Click the link below to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
```

### 5. Run Development Server

```bash
npm run dev
```

### 6. Build for Production

```bash
npm run build
```

## PWA Features

- Installable on mobile and desktop
- Offline support with service worker
- App-like experience with standalone display mode
- Responsive design for all screen sizes

## Health Calculations

- **BMI**: Body Mass Index
- **BMR**: Basal Metabolic Rate (Mifflin-St Jeor Equation)
- **TDEE**: Total Daily Energy Expenditure
- **Protein**: Daily protein requirements based on goal

## Technologies

- React 19
- Vite 6
- Tailwind CSS 4
- Supabase
- date-fns
- Lucide React
- Vite PWA Plugin
