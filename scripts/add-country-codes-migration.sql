-- Migration to add country code fields to user_profiles table
-- This script adds the new phone_country_code and emergency_contact_country_code columns

-- Add phone_country_code column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'phone_country_code'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN phone_country_code VARCHAR(10);
    END IF;
END $$;

-- Add emergency_contact_country_code column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'emergency_contact_country_code'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN emergency_contact_country_code VARCHAR(10);
    END IF;
END $$;

-- Set default values for existing records (Portugal as default)
UPDATE user_profiles 
SET phone_country_code = '+351' 
WHERE phone_country_code IS NULL;

UPDATE user_profiles 
SET emergency_contact_country_code = '+351' 
WHERE emergency_contact_country_code IS NULL;
