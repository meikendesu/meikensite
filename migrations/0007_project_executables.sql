ALTER TABLE projects ADD COLUMN executable_object_key TEXT;
ALTER TABLE projects ADD COLUMN executable_file_name TEXT;
ALTER TABLE projects ADD COLUMN executable_content_type TEXT;
ALTER TABLE projects ADD COLUMN executable_size INTEGER;
ALTER TABLE projects ADD COLUMN executable_uploaded_at TEXT;
