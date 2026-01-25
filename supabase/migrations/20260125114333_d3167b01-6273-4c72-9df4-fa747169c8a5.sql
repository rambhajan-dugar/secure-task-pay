-- =============================================
-- KAAM.COM SAFETY-FOCUSED TASK MARKETPLACE
-- Complete Database Schema for iOS App
-- =============================================

-- 1. ROLE ENUM for user types
CREATE TYPE public.app_role AS ENUM ('task_poster', 'task_doer', 'admin', 'safety_team');

-- 2. SOS STATUS ENUM
CREATE TYPE public.sos_status AS ENUM ('triggered', 'safety_team_responded', 'resolved', 'escalated');

-- 3. TASK STATUS ENUM (extends existing)
CREATE TYPE public.task_status AS ENUM (
  'open', 'accepted', 'in_progress', 'submitted', 
  'under_review', 'approved', 'disputed', 'completed', 'cancelled'
);

-- 4. PAYMENT STATUS ENUM
CREATE TYPE public.payment_status AS ENUM ('pending', 'in_escrow', 'released', 'disputed', 'refunded');

-- 5. TASK CATEGORY ENUM
CREATE TYPE public.task_category AS ENUM (
  'design', 'development', 'writing', 'marketing', 
  'data_entry', 'research', 'translation', 'video', 'audio', 'other'
);

-- =============================================
-- PROFILES TABLE (linked to auth.users)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'en',
  tasks_completed INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_earnings BIGINT DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================
-- USER ROLES TABLE (separate for security)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- =============================================
-- EMERGENCY CONTACTS TABLE
-- =============================================
CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  relationship TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================
-- TASKS TABLE
-- =============================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_code TEXT UNIQUE NOT NULL DEFAULT ('TASK-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8))),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category task_category NOT NULL DEFAULT 'other',
  reward_amount BIGINT NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  status task_status NOT NULL DEFAULT 'open',
  poster_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  doer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  location_lat DECIMAL(10,7),
  location_lng DECIMAL(10,7),
  location_address TEXT,
  is_in_person BOOLEAN DEFAULT false,
  accepted_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  auto_release_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================
-- ESCROW TRANSACTIONS TABLE
-- =============================================
CREATE TABLE public.escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  poster_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  doer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  gross_amount BIGINT NOT NULL,
  platform_fee BIGINT NOT NULL,
  fee_percentage DECIMAL(5,2) NOT NULL,
  net_payout BIGINT NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  released_at TIMESTAMPTZ,
  auto_release_at TIMESTAMPTZ
);

-- =============================================
-- SOS EVENTS TABLE (Core Safety Feature)
-- =============================================
CREATE TABLE public.sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  user_role TEXT NOT NULL, -- 'poster' or 'doer'
  status sos_status NOT NULL DEFAULT 'triggered',
  initial_latitude DECIMAL(10,7) NOT NULL,
  initial_longitude DECIMAL(10,7) NOT NULL,
  current_latitude DECIMAL(10,7),
  current_longitude DECIMAL(10,7),
  last_location_update TIMESTAMPTZ,
  emergency_contact_notified BOOLEAN DEFAULT false,
  safety_team_notified BOOLEAN DEFAULT false,
  safety_team_notified_at TIMESTAMPTZ,
  safety_team_member_id UUID REFERENCES auth.users(id),
  is_silent_mode BOOLEAN DEFAULT false,
  simulated_emergency_call TEXT, -- '112' or '102'
  resolution_notes TEXT,
  triggered_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  responded_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- =============================================
-- SOS LOCATION HISTORY (GPS tracking every 4 sec)
-- =============================================
CREATE TABLE public.sos_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sos_event_id UUID REFERENCES public.sos_events(id) ON DELETE CASCADE NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  accuracy DECIMAL(10,2),
  recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================
-- AUDIO RECORDINGS TABLE (Simulated for demo)
-- =============================================
CREATE TABLE public.sos_audio_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sos_event_id UUID REFERENCES public.sos_events(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT,
  duration_seconds INTEGER,
  is_simulated BOOLEAN DEFAULT true,
  recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================
-- DISPUTES TABLE
-- =============================================
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  escrow_id UUID REFERENCES public.escrow_transactions(id) ON DELETE SET NULL,
  raised_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  raised_by_role TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  resolved_in_favor_of TEXT
);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_audio_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECKS
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- =============================================
-- RLS POLICIES - PROFILES
-- =============================================
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - USER ROLES
-- =============================================
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roles" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - EMERGENCY CONTACTS
-- =============================================
CREATE POLICY "Users can manage own emergency contacts" ON public.emergency_contacts
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - TASKS
-- =============================================
CREATE POLICY "Anyone can view open tasks" ON public.tasks
  FOR SELECT USING (status = 'open' OR poster_id = auth.uid() OR doer_id = auth.uid());

CREATE POLICY "Authenticated users can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = poster_id);

CREATE POLICY "Task owners can update their tasks" ON public.tasks
  FOR UPDATE USING (poster_id = auth.uid() OR doer_id = auth.uid());

-- =============================================
-- RLS POLICIES - ESCROW
-- =============================================
CREATE POLICY "Users can view own escrow transactions" ON public.escrow_transactions
  FOR SELECT USING (poster_id = auth.uid() OR doer_id = auth.uid());

CREATE POLICY "Users can create escrow for their tasks" ON public.escrow_transactions
  FOR INSERT WITH CHECK (poster_id = auth.uid());

-- =============================================
-- RLS POLICIES - SOS EVENTS
-- =============================================
CREATE POLICY "Users can view own SOS events" ON public.sos_events
  FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'safety_team') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own SOS events" ON public.sos_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users or safety team can update SOS" ON public.sos_events
  FOR UPDATE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'safety_team') OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- RLS POLICIES - SOS LOCATION HISTORY
-- =============================================
CREATE POLICY "View location history for own SOS or safety team" ON public.sos_location_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sos_events 
      WHERE id = sos_event_id 
      AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'safety_team'))
    )
  );

CREATE POLICY "Insert location for own SOS" ON public.sos_location_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sos_events 
      WHERE id = sos_event_id AND user_id = auth.uid()
    )
  );

-- =============================================
-- RLS POLICIES - AUDIO RECORDINGS
-- =============================================
CREATE POLICY "View recordings for own SOS or safety team" ON public.sos_audio_recordings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sos_events 
      WHERE id = sos_event_id 
      AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'safety_team'))
    )
  );

CREATE POLICY "Insert recordings for own SOS" ON public.sos_audio_recordings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sos_events WHERE id = sos_event_id AND user_id = auth.uid()
    )
  );

-- =============================================
-- RLS POLICIES - DISPUTES
-- =============================================
CREATE POLICY "View disputes for involved parties" ON public.disputes
  FOR SELECT USING (
    raised_by_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND (poster_id = auth.uid() OR doer_id = auth.uid()))
  );

CREATE POLICY "Create disputes for own tasks" ON public.disputes
  FOR INSERT WITH CHECK (auth.uid() = raised_by_id);

-- =============================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
  );
  
  -- Auto-assign role from signup metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'task_doer')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ENABLE REALTIME FOR SOS TRACKING
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_location_history;