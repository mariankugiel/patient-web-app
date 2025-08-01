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

-- Enable Row Level Security
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_pressure_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE composite_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own health metrics" ON health_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health metrics" ON health_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health metrics" ON health_metrics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health metrics" ON health_metrics
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own blood pressure" ON blood_pressure_readings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blood pressure" ON blood_pressure_readings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blood pressure" ON blood_pressure_readings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own blood pressure" ON blood_pressure_readings
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own composite metrics" ON composite_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own composite metrics" ON composite_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own composite metrics" ON composite_metrics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own composite metrics" ON composite_metrics
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_health_metrics_user_type ON health_metrics(user_id, metric_type);
CREATE INDEX idx_health_metrics_recorded_at ON health_metrics(recorded_at);
CREATE INDEX idx_blood_pressure_user_recorded ON blood_pressure_readings(user_id, recorded_at);
CREATE INDEX idx_composite_metrics_user_type ON composite_metrics(user_id, panel_type);
