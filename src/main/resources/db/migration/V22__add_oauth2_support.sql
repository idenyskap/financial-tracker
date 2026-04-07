ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'LOCAL';
ALTER TABLE users ADD COLUMN google_id VARCHAR(255);
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

CREATE UNIQUE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;