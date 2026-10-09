-- Read-only post-apply check for migrations 001-009.
-- Run in the target project's SQL Editor; this query reads metadata only.

with required_tables(table_name) as (
  values
    ('firebase_documents_archive'),
    ('app_user_profiles'),
    ('app_documents'),
    ('firebase_sync_state'),
    ('firebase_snapshot_reconciliation')
),
table_checks as (
  select
    required_tables.table_name,
    (catalog.oid is not null) as table_exists,
    coalesce(catalog.relrowsecurity, false) as rls_enabled
  from required_tables
  left join pg_class catalog
    on catalog.oid = to_regclass('public.' || required_tables.table_name)
),
function_checks(function_name, signature) as (
  values
    ('hydrate_app_documents_from_archive', 'public.hydrate_app_documents_from_archive()'),
    ('apply_firebase_document_event', 'public.apply_firebase_document_event(text,text,text,text,boolean,jsonb,timestamp with time zone)'),
    ('reconcile_firebase_snapshot', 'public.reconcile_firebase_snapshot(uuid,timestamp with time zone,bigint)')
),
policy_check as (
  select count(*)::integer as policy_count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'app_documents'
)
select
  'table:' || table_name as check_name,
  table_exists and rls_enabled as passed,
  jsonb_build_object('exists', table_exists, 'rlsEnabled', rls_enabled) as details
from table_checks

union all

select
  'function:' || function_name,
  to_regprocedure(signature) is not null,
  jsonb_build_object('signaturePresent', to_regprocedure(signature) is not null)
from function_checks

union all

select
  'policy:app_documents',
  policy_count = 6,
  jsonb_build_object('policyCount', policy_count)
from policy_check

union all

select
  'grant:anon_read_app_documents',
  coalesce(has_table_privilege('anon', to_regclass('public.app_documents'), 'SELECT'), false),
  jsonb_build_object('selectGranted', coalesce(has_table_privilege('anon', to_regclass('public.app_documents'), 'SELECT'), false))

union all

select
  'grant:anon_no_archive_read',
  not coalesce(has_table_privilege('anon', to_regclass('public.firebase_documents_archive'), 'SELECT'), false),
  jsonb_build_object('selectGranted', coalesce(has_table_privilege('anon', to_regclass('public.firebase_documents_archive'), 'SELECT'), false))

order by check_name;
