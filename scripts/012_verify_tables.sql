-- Verification script to check if new tables exist
-- Run this to verify that all campaign tables are created

SELECT 
  'master_customers' as table_name,
  CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'master_customers') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status
UNION ALL
SELECT 
  'master_campaigns' as table_name,
  CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'master_campaigns') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status
UNION ALL
SELECT 
  'campaigns' as table_name,
  CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'campaigns') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status
UNION ALL
SELECT 
  'campaign_activities' as table_name,
  CASE WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'campaign_activities') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

