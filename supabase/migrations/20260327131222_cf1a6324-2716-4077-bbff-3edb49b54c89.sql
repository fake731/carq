
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table (custom username/password auth)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'garage', 'admin')),
  garage_id TEXT,
  garage_name TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update profiles" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete profiles" ON public.profiles FOR DELETE USING (true);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Garages table
CREATE TABLE public.garages (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone TEXT,
  address TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.garages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read garages" ON public.garages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert garages" ON public.garages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update garages" ON public.garages FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete garages" ON public.garages FOR DELETE USING (true);

CREATE TRIGGER update_garages_updated_at BEFORE UPDATE ON public.garages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cars table
CREATE TABLE public.cars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  plate_number TEXT NOT NULL,
  color TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'inspecting', 'repairing', 'waiting_parts', 'ready')),
  estimated_cost NUMERIC DEFAULT 0,
  estimated_time TEXT,
  notes TEXT,
  garage_id TEXT REFERENCES public.garages(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read cars" ON public.cars FOR SELECT USING (true);
CREATE POLICY "Anyone can insert cars" ON public.cars FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update cars" ON public.cars FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete cars" ON public.cars FOR DELETE USING (true);

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON public.cars
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Car updates / timeline
CREATE TABLE public.car_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('received', 'inspecting', 'repairing', 'waiting_parts', 'ready')),
  message TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.car_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read car_updates" ON public.car_updates FOR SELECT USING (true);
CREATE POLICY "Anyone can insert car_updates" ON public.car_updates FOR INSERT WITH CHECK (true);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('status', 'message', 'photo', 'system')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Anyone can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update notifications" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete notifications" ON public.notifications FOR DELETE USING (true);

-- Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update messages" ON public.messages FOR UPDATE USING (true);

-- Storage bucket for car images
INSERT INTO storage.buckets (id, name, public) VALUES ('car-images', 'car-images', true);

CREATE POLICY "Anyone can view car images" ON storage.objects FOR SELECT USING (bucket_id = 'car-images');
CREATE POLICY "Anyone can upload car images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'car-images');

-- Insert default admin profile
INSERT INTO public.profiles (username, password, full_name, phone, role)
VALUES ('bmw555', '123456789', 'المطور', '00000000', 'admin');

-- Insert default garages profiles
INSERT INTO public.profiles (username, password, full_name, phone, role, garage_id, garage_name, is_premium)
VALUES 
  ('alnoor_garage', 'alnoor123', 'كراج النور المتقدم', '96811111', 'garage', 'g1', 'كراج النور المتقدم', true),
  ('alsaqr_garage', 'alsaqr123', 'كراج الصقر', '96822222', 'garage', 'g2', 'كراج الصقر', false);

-- Insert garages table data
INSERT INTO public.garages (id, name, phone, is_premium)
VALUES 
  ('g1', 'كراج النور المتقدم', '96811111', true),
  ('g2', 'كراج الصقر', '96822222', false);

-- Insert sample customers
INSERT INTO public.profiles (username, password, full_name, phone, role)
VALUES 
  ('ahmed_h', 'ahmed123', 'أحمد بن سعيد الحارثي', '96812345', 'customer'),
  ('salem_b', 'salem123', 'سالم بن خالد البلوشي', '96887654', 'customer'),
  ('mohammed_r', 'mohammed123', 'محمد بن علي الريامي', '96898765', 'customer');

-- Insert sample cars
INSERT INTO public.cars (make, model, year, plate_number, color, owner_name, owner_phone, status, estimated_cost, estimated_time, notes, garage_id)
VALUES 
  ('تويوتا', 'كامري', 2022, 'أ ب ج 1234', 'أبيض', 'أحمد بن سعيد الحارثي', '96812345', 'repairing', 450, '3 أيام', 'تغيير فلتر الزيت + فحص الفرامل', 'g1'),
  ('نيسان', 'باترول', 2023, 'د هـ و 5678', 'أسود', 'سالم بن خالد البلوشي', '96887654', 'waiting_parts', 1200, '5 أيام', 'مشكلة في علبة التروس - بانتظار قطعة غيار', 'g1'),
  ('هوندا', 'أكورد', 2021, 'ز ح ط 9012', 'فضي', 'محمد بن علي الريامي', '96898765', 'ready', 200, 'يوم واحد', 'تغيير بطارية + فحص كهرباء', 'g2'),
  ('لكزس', 'ES350', 2024, 'ك ل م 3456', 'أبيض لؤلؤي', 'أحمد بن سعيد الحارثي', '96812345', 'inspecting', 800, '4 أيام', 'فحص شامل + تغيير زيت ناقل الحركة', 'g1'),
  ('تويوتا', 'لاندكروزر', 2023, 'ن س ع 7890', 'ذهبي', 'سالم بن خالد البلوشي', '96887654', 'received', 350, '2 أيام', 'صيانة دورية 50 ألف كم', 'g2');
