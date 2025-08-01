-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  phone VARCHAR(20),
  address TEXT,
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  medical_record_number VARCHAR(50),
  insurance_provider VARCHAR(200),
  insurance_policy_number VARCHAR(100),
  preferred_language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health metrics table
CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type VARCHAR(100) NOT NULL, -- 'glucose', 'weight', 'cholesterol', etc.
  metric_name VARCHAR(255) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50),
  reference_range VARCHAR(100), -- e.g., "70-99 mg/dL"
  status VARCHAR(50) DEFAULT 'normal' CHECK (status IN ('normal', 'abnormal', 'critical')),
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blood pressure specific table (for systolic/diastolic pairs)
CREATE TABLE IF NOT EXISTS blood_pressure_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  systolic INTEGER NOT NULL,
  diastolic INTEGER NOT NULL,
  pulse INTEGER,
  status VARCHAR(50) DEFAULT 'normal' CHECK (status IN ('normal', 'abnormal', 'critical')),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Composite metrics (like cholesterol panels)
CREATE TABLE IF NOT EXISTS composite_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  panel_type VARCHAR(100) NOT NULL, -- 'lipid_panel', 'metabolic_panel', etc.
  components JSONB NOT NULL, -- Store multiple values
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_name VARCHAR(200) NOT NULL,
  specialty VARCHAR(100),
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  appointment_type VARCHAR(50) DEFAULT 'in-person' CHECK (appointment_type IN ('in-person', 'virtual', 'phone')),
  status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled', 'rescheduled')),
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medications table
CREATE TABLE IF NOT EXISTS medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  purpose TEXT,
  prescribed_by VARCHAR(200),
  start_date DATE,
  end_date DATE,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  prescription_number VARCHAR(100),
  pharmacy VARCHAR(200),
  refills_remaining INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medication reminders table
CREATE TABLE IF NOT EXISTS medication_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
  time TIME NOT NULL,
  days_of_week INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Monday, 7=Sunday
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical records table
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  record_type VARCHAR(100) NOT NULL, -- 'lab_results', 'imaging', 'visit_summary', etc.
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  provider VARCHAR(200),
  doctor VARCHAR(200),
  status VARCHAR(100),
  summary TEXT,
  file_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health plans table
CREATE TABLE IF NOT EXISTS health_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  current_value VARCHAR(100),
  target_value VARCHAR(100),
  status VARCHAR(50) DEFAULT 'moderate' CHECK (status IN ('good', 'moderate', 'poor')),
  progress_explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name VARCHAR(200) NOT NULL,
  sender_role VARCHAR(100), -- 'doctor', 'nurse', 'admin', etc.
  subject VARCHAR(255),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  message_type VARCHAR(50) DEFAULT 'general' CHECK (message_type IN ('general', 'appointment', 'test_result', 'prescription')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_name VARCHAR(200) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  relationship VARCHAR(100),
  permissions JSONB DEFAULT '{}', -- Store permission settings as JSON
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
