-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert menu configuration
INSERT INTO settings (key, value) VALUES (
    'menu',
    '[
        {"id": 1, "label": "מותגים", "path": "/brands", "order": 1, "isDropdown": true},
        {"id": 2, "label": "קטגוריות", "path": "/categories", "order": 2},
        {"id": 3, "label": "הגרלת בשמים", "path": "/lottery", "order": 3, "isRed": true},
        {"id": 4, "label": "התאמת מארזים", "path": "/matching", "order": 4},
        {"id": 5, "label": "אודות", "path": "/about", "order": 5},
        {"id": 6, "label": "צור קשר", "path": "/contact", "order": 6}
    ]'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
