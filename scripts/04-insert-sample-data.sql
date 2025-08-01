-- Insert sample data for testing
-- Note: Replace the user_id values with actual UUIDs from your test user account

-- First, let's create a function to get or create a test user profile
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get the first user from auth.users (your test user)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Insert user profile
        INSERT INTO user_profiles (
            id, first_name, last_name, date_of_birth, phone, address,
            emergency_contact_name, emergency_contact_phone, medical_record_number,
            insurance_provider, insurance_policy_number, preferred_language
        ) VALUES (
            test_user_id, 'John', 'Doe', '1985-03-15', '+1-555-0123', 
            '123 Main St, Anytown, ST 12345',
            'Jane Doe', '+1-555-0124', 'MRN123456789',
            'HealthCare Plus', 'POL987654321', 'en'
        ) ON CONFLICT (id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            updated_at = NOW();

        -- Insert health metrics (Blood glucose readings - multiple values for chart)
        INSERT INTO health_metrics (user_id, metric_type, metric_name, value, unit, reference_range, recorded_at) VALUES
        (test_user_id, 'glucose', 'Blood Glucose', 110, 'mg/dL', '70-99', '2023-01-15 08:00:00+00'),
        (test_user_id, 'glucose', 'Blood Glucose', 108, 'mg/dL', '70-99', '2023-02-15 08:00:00+00'),
        (test_user_id, 'glucose', 'Blood Glucose', 105, 'mg/dL', '70-99', '2023-03-15 08:00:00+00'),
        (test_user_id, 'glucose', 'Blood Glucose', 102, 'mg/dL', '70-99', '2023-04-15 08:00:00+00'),
        (test_user_id, 'glucose', 'Blood Glucose', 98, 'mg/dL', '70-99', '2023-05-15 08:00:00+00');

        -- Weight readings (multiple values for chart)
        INSERT INTO health_metrics (user_id, metric_type, metric_name, value, unit, reference_range, recorded_at) VALUES
        (test_user_id, 'weight', 'Weight', 165, 'lbs', '145-165', '2023-01-15 09:00:00+00'),
        (test_user_id, 'weight', 'Weight', 163, 'lbs', '145-165', '2023-02-15 09:00:00+00'),
        (test_user_id, 'weight', 'Weight', 161, 'lbs', '145-165', '2023-03-15 09:00:00+00'),
        (test_user_id, 'weight', 'Weight', 160, 'lbs', '145-165', '2023-04-15 09:00:00+00'),
        (test_user_id, 'weight', 'Weight', 158, 'lbs', '145-165', '2023-05-15 09:00:00+00');

        -- Cholesterol readings (two values for chart)
        INSERT INTO health_metrics (user_id, metric_type, metric_name, value, unit, reference_range, recorded_at) VALUES
        (test_user_id, 'cholesterol', 'Total Cholesterol', 210, 'mg/dL', '<200', '2023-01-15 10:00:00+00'),
        (test_user_id, 'cholesterol', 'Total Cholesterol', 195, 'mg/dL', '<200', '2023-05-15 10:00:00+00');

        -- Single value metrics (will show card only)
        INSERT INTO health_metrics (user_id, metric_type, metric_name, value, unit, reference_range, recorded_at) VALUES
        (test_user_id, 'vitamin_d', 'Vitamin D', 25, 'ng/mL', '30-100', '2023-05-15 11:00:00+00'),
        (test_user_id, 'temperature', 'Body Temperature', 98.6, '°F', '97.8-99.1', '2023-05-15 12:00:00+00');

        -- Blood pressure readings (multiple values for chart)
        INSERT INTO blood_pressure_readings (user_id, systolic, diastolic, pulse, recorded_at) VALUES
        (test_user_id, 145, 92, 72, '2023-01-15 08:30:00+00'),
        (test_user_id, 142, 90, 70, '2023-02-15 08:30:00+00'),
        (test_user_id, 138, 88, 71, '2023-03-15 08:30:00+00'),
        (test_user_id, 135, 87, 69, '2023-04-15 08:30:00+00'),
        (test_user_id, 132, 85, 68, '2023-05-15 08:30:00+00');

        -- Sample appointments
        INSERT INTO appointments (user_id, doctor_name, specialty, appointment_date, appointment_type, status, location) VALUES
        (test_user_id, 'Dr. Sarah Johnson', 'Cardiologist', '2024-02-20 10:00:00+00', 'virtual', 'upcoming', 'Virtual Consultation'),
        (test_user_id, 'Dr. Michael Chen', 'Primary Care', '2024-02-25 14:30:00+00', 'in-person', 'upcoming', 'Main Clinic - Room 205'),
        (test_user_id, 'Dr. Emily Rodriguez', 'Endocrinologist', '2023-12-15 11:00:00+00', 'in-person', 'completed', 'Specialty Clinic'),
        (test_user_id, 'Dr. James Wilson', 'Dermatologist', '2023-12-10 09:30:00+00', 'virtual', 'cancelled', 'Virtual Consultation'),
        (test_user_id, 'Dr. Lisa Patel', 'Psychiatrist', '2024-02-28 13:00:00+00', 'phone', 'upcoming', 'Phone Consultation');

        -- Sample medications
        INSERT INTO medications (user_id, name, dosage, frequency, purpose, prescribed_by, start_date, instructions, prescription_number, pharmacy, refills_remaining) VALUES
        (test_user_id, 'Lisinopril', '10mg', 'Once daily', 'Blood pressure management', 'Dr. Sarah Johnson', '2023-01-15', 'Take one tablet by mouth once daily in the morning with or without food.', 'RX12345678', 'MediCare Pharmacy', 2),
        (test_user_id, 'Atorvastatin', '20mg', 'Once daily', 'Cholesterol management', 'Dr. Sarah Johnson', '2023-01-15', 'Take one tablet by mouth once daily in the evening.', 'RX12345679', 'MediCare Pharmacy', 2),
        (test_user_id, 'Metformin', '500mg', 'Twice daily', 'Diabetes management', 'Dr. Michael Chen', '2023-02-10', 'Take one tablet by mouth twice daily with meals.', 'RX12345680', 'MediCare Pharmacy', 3);

        -- Sample medication reminders
        INSERT INTO medication_reminders (medication_id, time, days_of_week, is_enabled)
        SELECT m.id, '08:00:00', '{1,2,3,4,5,6,7}', true
        FROM medications m WHERE m.user_id = test_user_id AND m.name = 'Lisinopril';

        INSERT INTO medication_reminders (medication_id, time, days_of_week, is_enabled)
        SELECT m.id, '20:00:00', '{1,2,3,4,5,6,7}', true
        FROM medications m WHERE m.user_id = test_user_id AND m.name = 'Atorvastatin';

        INSERT INTO medication_reminders (medication_id, time, days_of_week, is_enabled)
        SELECT m.id, '08:00:00', '{1,2,3,4,5,6,7}', true
        FROM medications m WHERE m.user_id = test_user_id AND m.name = 'Metformin';

        INSERT INTO medication_reminders (medication_id, time, days_of_week, is_enabled)
        SELECT m.id, '18:00:00', '{1,2,3,4,5,6,7}', true
        FROM medications m WHERE m.user_id = test_user_id AND m.name = 'Metformin';

        -- Sample medical records
        INSERT INTO medical_records (user_id, record_type, name, date, provider, doctor, status, summary, file_url) VALUES
        (test_user_id, 'lab_results', 'Complete Blood Count', '2023-04-15', 'VitaHub Medical Center', 'Dr. Sarah Johnson', 'Abnormal', 'White blood cell count elevated. All other parameters within normal range.', '/documents/cbc-20230415.pdf'),
        (test_user_id, 'imaging', 'Chest X-Ray', '2023-03-22', 'VitaHub Imaging Center', 'Dr. Michael Chen', 'Normal', 'No abnormalities detected. Lungs clear.', '/documents/chest-xray-20230322.pdf'),
        (test_user_id, 'lab_results', 'Lipid Panel', '2023-02-10', 'VitaHub Medical Center', 'Dr. Sarah Johnson', 'Abnormal', 'Total cholesterol and LDL elevated. HDL and triglycerides within normal range.', '/documents/lipid-20230210.pdf'),
        (test_user_id, 'visit_summary', 'Annual Physical', '2023-01-15', 'VitaHub Medical Center', 'Dr. Sarah Johnson', 'Completed', 'Annual physical examination. Blood pressure elevated. Weight slightly above ideal range. Recommended lifestyle modifications and medication adjustment.', '/documents/annual-physical-20230115.pdf');

        -- Sample health plans
        INSERT INTO health_plans (user_id, title, current_value, target_value, status, progress_explanation) VALUES
        (test_user_id, 'Blood Pressure Management', '132/85 mmHg', '< 120/80 mmHg', 'moderate', 'Showing improvement with medication, but still above target range.'),
        (test_user_id, 'Weight Management', '158 lbs', '150 lbs', 'good', 'Lost 7 pounds in the last 3 months. On track to reach target.'),
        (test_user_id, 'Cholesterol Management', 'LDL: 125 mg/dL', 'LDL: < 100 mg/dL', 'poor', 'Limited progress despite medication. Consider dietary changes.');

        -- Sample messages
        INSERT INTO messages (user_id, sender_name, sender_role, subject, content, is_read, message_type) VALUES
        (test_user_id, 'Dr. Sarah Johnson', 'doctor', 'Lab Results Available', 'Your recent blood work results are now available. Please review and contact us if you have any questions.', false, 'test_result'),
        (test_user_id, 'Nurse Mary', 'nurse', 'Appointment Reminder', 'This is a reminder for your upcoming appointment on February 20th at 10:00 AM.', false, 'appointment'),
        (test_user_id, 'Pharmacy Team', 'admin', 'Prescription Ready', 'Your prescription for Lisinopril is ready for pickup at MediCare Pharmacy.', true, 'prescription'),
        (test_user_id, 'Dr. Michael Chen', 'doctor', 'Follow-up Required', 'Based on your recent visit, we recommend scheduling a follow-up appointment in 3 months.', true, 'general');

        -- Sample permissions
        INSERT INTO user_permissions (user_id, contact_name, contact_email, contact_phone, relationship, permissions) VALUES
        (test_user_id, 'Jane Doe', 'jane.doe@email.com', '+1-555-0124', 'Spouse', '{"view_medical_records": true, "view_appointments": true, "view_medications": false}'),
        (test_user_id, 'Dr. Robert Smith', 'dr.smith@clinic.com', '+1-555-0199', 'Primary Care Physician', '{"view_medical_records": true, "view_appointments": true, "view_medications": true, "emergency_contact": true}');

        RAISE NOTICE 'Sample data inserted successfully for user ID: %', test_user_id;
    ELSE
        RAISE NOTICE 'No users found in auth.users table. Please create a test user first.';
    END IF;
END $$;
