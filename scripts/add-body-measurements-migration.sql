-- Migration to add body measurement fields to user_profiles table
-- This script adds height, weight, and waist_diameter columns

-- Add height column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'height'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN height DECIMAL(5,2);
        RAISE NOTICE 'Column height added to user_profiles table.';
    ELSE
        RAISE NOTICE 'Column height already exists in user_profiles table.';
    END IF;
END $$;

-- Add weight column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'weight'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN weight DECIMAL(5,2);
        RAISE NOTICE 'Column weight added to user_profiles table.';
    ELSE
        RAISE NOTICE 'Column weight already exists in user_profiles table.';
    END IF;
END $$;

-- Add waist_diameter column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'waist_diameter'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN waist_diameter DECIMAL(5,2);
        RAISE NOTICE 'Column waist_diameter added to user_profiles table.';
    ELSE
        RAISE NOTICE 'Column waist_diameter already exists in user_profiles table.';
    END IF;
END $$;
