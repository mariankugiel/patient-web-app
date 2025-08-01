-- Insert sample health metrics for testing
-- Replace 'your-user-id-here' with actual user ID from auth.users

-- Blood glucose readings (multiple values - will show chart)
INSERT INTO health_metrics (user_id, metric_type, metric_name, value, unit, reference_range, recorded_at) VALUES
('your-user-id-here', 'glucose', 'Blood Glucose', 110, 'mg/dL', '70-99', '2023-01-15 08:00:00+00'),
('your-user-id-here', 'glucose', 'Blood Glucose', 108, 'mg/dL', '70-99', '2023-02-15 08:00:00+00'),
('your-user-id-here', 'glucose', 'Blood Glucose', 105, 'mg/dL', '70-99', '2023-03-15 08:00:00+00'),
('your-user-id-here', 'glucose', 'Blood Glucose', 102, 'mg/dL', '70-99', '2023-04-15 08:00:00+00'),
('your-user-id-here', 'glucose', 'Blood Glucose', 98, 'mg/dL', '70-99', '2023-05-15 08:00:00+00');

-- Weight readings (multiple values - will show chart)
INSERT INTO health_metrics (user_id, metric_type, metric_name, value, unit, reference_range, recorded_at) VALUES
('your-user-id-here', 'weight', 'Weight', 165, 'lbs', '145-165', '2023-01-15 09:00:00+00'),
('your-user-id-here', 'weight', 'Weight', 163, 'lbs', '145-165', '2023-02-15 09:00:00+00'),
('your-user-id-here', 'weight', 'Weight', 161, 'lbs', '145-165', '2023-03-15 09:00:00+00'),
('your-user-id-here', 'weight', 'Weight', 160, 'lbs', '145-165', '2023-04-15 09:00:00+00'),
('your-user-id-here', 'weight', 'Weight', 158, 'lbs', '145-165', '2023-05-15 09:00:00+00');

-- Cholesterol readings (two values - will show chart)
INSERT INTO health_metrics (user_id, metric_type, metric_name, value, unit, reference_range, recorded_at) VALUES
('your-user-id-here', 'cholesterol', 'Total Cholesterol', 210, 'mg/dL', '<200', '2023-01-15 10:00:00+00'),
('your-user-id-here', 'cholesterol', 'Total Cholesterol', 195, 'mg/dL', '<200', '2023-05-15 10:00:00+00');

-- Single value metric (will show card only)
INSERT INTO health_metrics (user_id, metric_type, metric_name, value, unit, reference_range, recorded_at) VALUES
('your-user-id-here', 'vitamin_d', 'Vitamin D', 25, 'ng/mL', '30-100', '2023-05-15 11:00:00+00');

-- Temperature readings (single value - will show card)
INSERT INTO health_metrics (user_id, metric_type, metric_name, value, unit, reference_range, recorded_at) VALUES
('your-user-id-here', 'temperature', 'Body Temperature', 98.6, '°F', '97.8-99.1', '2023-05-15 12:00:00+00');

-- Blood pressure readings (multiple values - will show chart)
INSERT INTO blood_pressure_readings (user_id, systolic, diastolic, pulse, recorded_at) VALUES
('your-user-id-here', 145, 92, 72, '2023-01-15 08:30:00+00'),
('your-user-id-here', 142, 90, 70, '2023-02-15 08:30:00+00'),
('your-user-id-here', 138, 88, 71, '2023-03-15 08:30:00+00'),
('your-user-id-here', 135, 87, 69, '2023-04-15 08:30:00+00'),
('your-user-id-here', 132, 85, 68, '2023-05-15 08:30:00+00');
