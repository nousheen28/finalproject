-- Update places table to ensure it has all the fields we need
ALTER TABLE places ADD COLUMN IF NOT EXISTS photos TEXT;
ALTER TABLE places ADD COLUMN IF NOT EXISTS rating REAL;
ALTER TABLE places ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE places ADD COLUMN IF NOT EXISTS phone TEXT;