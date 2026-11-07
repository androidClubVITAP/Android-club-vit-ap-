-- =============================================================================
-- ANDROID CLUB VIT-AP — remove demo content
-- Deletes only the rows created by supabase/seed.sql, identified by their fixed
-- ids. Real content, club settings, admins and uploaded media are untouched.
--
-- Safe to run more than once. If a real event still references a seeded team
-- member, that member is archived as "former" instead of being deleted, so
-- event history and foreign keys stay intact.
-- =============================================================================

-- Announcements first: seeded announcements point at seeded events.
delete from public.announcements
where id in (
  '50000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000002',
  '50000000-0000-4000-8000-000000000003',
  '50000000-0000-4000-8000-000000000004'
);

-- Event images and organizer links cascade with their events.
delete from public.events
where id in (
  '30000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000002',
  '30000000-0000-4000-8000-000000000003',
  '30000000-0000-4000-8000-000000000004',
  '30000000-0000-4000-8000-000000000005'
);

-- Team members referenced by any remaining (real) event are kept as former.
update public.team_members m
set current = false
where m.id in (
  '20000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  '20000000-0000-4000-8000-000000000003',
  '20000000-0000-4000-8000-000000000004',
  '20000000-0000-4000-8000-000000000005'
)
and exists (
  select 1 from public.event_organizers o where o.member_id = m.id
);

delete from public.team_members m
where m.id in (
  '20000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  '20000000-0000-4000-8000-000000000003',
  '20000000-0000-4000-8000-000000000004',
  '20000000-0000-4000-8000-000000000005'
)
and not exists (
  select 1 from public.event_organizers o where o.member_id = m.id
);

-- Roles used by real team members are kept so leadership ranking is unchanged.
delete from public.team_roles r
where r.id in (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000005',
  '10000000-0000-4000-8000-000000000006',
  '10000000-0000-4000-8000-000000000007',
  '10000000-0000-4000-8000-000000000008'
)
and not exists (
  select 1 from public.team_members m where m.designation = r.name
);
