-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_pressure_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE composite_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Health metrics policies
CREATE POLICY "Users can view own health metrics" ON health_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health metrics" ON health_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health metrics" ON health_metrics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health metrics" ON health_metrics
  FOR DELETE USING (auth.uid() = user_id);

-- Blood pressure policies
CREATE POLICY "Users can view own blood pressure" ON blood_pressure_readings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blood pressure" ON blood_pressure_readings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blood pressure" ON blood_pressure_readings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own blood pressure" ON blood_pressure_readings
  FOR DELETE USING (auth.uid() = user_id);

-- Composite metrics policies
CREATE POLICY "Users can view own composite metrics" ON composite_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own composite metrics" ON composite_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own composite metrics" ON composite_metrics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own composite metrics" ON composite_metrics
  FOR DELETE USING (auth.uid() = user_id);

-- Appointments policies
CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments" ON appointments
  FOR DELETE USING (auth.uid() = user_id);

-- Medications policies
CREATE POLICY "Users can view own medications" ON medications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medications" ON medications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medications" ON medications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medications" ON medications
  FOR DELETE USING (auth.uid() = user_id);

-- Medication reminders policies
CREATE POLICY "Users can view own medication reminders" ON medication_reminders
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM medications WHERE id = medication_id));

CREATE POLICY "Users can insert own medication reminders" ON medication_reminders
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM medications WHERE id = medication_id));

CREATE POLICY "Users can update own medication reminders" ON medication_reminders
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM medications WHERE id = medication_id));

CREATE POLICY "Users can delete own medication reminders" ON medication_reminders
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM medications WHERE id = medication_id));

-- Medical records policies
CREATE POLICY "Users can view own medical records" ON medical_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medical records" ON medical_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medical records" ON medical_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medical records" ON medical_records
  FOR DELETE USING (auth.uid() = user_id);

-- Health plans policies
CREATE POLICY "Users can view own health plans" ON health_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health plans" ON health_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health plans" ON health_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health plans" ON health_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE USING (auth.uid() = user_id);

-- User permissions policies
CREATE POLICY "Users can view own permissions" ON user_permissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own permissions" ON user_permissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own permissions" ON user_permissions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own permissions" ON user_permissions
  FOR DELETE USING (auth.uid() = user_id);
