-- Create indexes for better performance
CREATE INDEX idx_health_metrics_user_type ON health_metrics(user_id, metric_type);
CREATE INDEX idx_health_metrics_recorded_at ON health_metrics(recorded_at);
CREATE INDEX idx_blood_pressure_user_recorded ON blood_pressure_readings(user_id, recorded_at);
CREATE INDEX idx_composite_metrics_user_type ON composite_metrics(user_id, panel_type);
CREATE INDEX idx_appointments_user_date ON appointments(user_id, appointment_date);
CREATE INDEX idx_medications_user_active ON medications(user_id, is_active);
CREATE INDEX idx_medical_records_user_date ON medical_records(user_id, date);
CREATE INDEX idx_messages_user_read ON messages(user_id, is_read);
CREATE INDEX idx_user_permissions_user_active ON user_permissions(user_id, is_active);
