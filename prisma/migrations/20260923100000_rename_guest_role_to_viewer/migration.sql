-- Rename the GUEST role to VIEWER (role names are data, not schema).
UPDATE "role" SET "name" = 'VIEWER' WHERE "name" = 'GUEST';
