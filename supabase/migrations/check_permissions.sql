-- Check permissions for all tables
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Grant permissions to anon role for read access
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON templates TO anon;
GRANT SELECT ON projects TO anon;
GRANT SELECT ON project_versions TO anon;
GRANT SELECT ON project_layers TO anon;
GRANT SELECT ON project_shares TO anon;
GRANT SELECT ON project_comments TO anon;

-- Grant full permissions to authenticated role
GRANT ALL PRIVILEGES ON profiles TO authenticated;
GRANT ALL PRIVILEGES ON templates TO authenticated;
GRANT ALL PRIVILEGES ON projects TO authenticated;
GRANT ALL PRIVILEGES ON project_versions TO authenticated;
GRANT ALL PRIVILEGES ON project_layers TO authenticated;
GRANT ALL PRIVILEGES ON project_shares TO authenticated;
GRANT ALL PRIVILEGES ON project_comments TO authenticated;