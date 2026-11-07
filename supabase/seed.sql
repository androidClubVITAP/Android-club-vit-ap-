insert into public.team_roles (id, name, rank) values
  ('10000000-0000-4000-8000-000000000001', 'Club Lead', 1),
  ('10000000-0000-4000-8000-000000000002', 'Co-Lead', 2),
  ('10000000-0000-4000-8000-000000000003', 'President', 1),
  ('10000000-0000-4000-8000-000000000004', 'Vice President', 2),
  ('10000000-0000-4000-8000-000000000005', 'Technical Lead', 3),
  ('10000000-0000-4000-8000-000000000006', 'Design Lead', 3),
  ('10000000-0000-4000-8000-000000000007', 'Event Coordinator', 4),
  ('10000000-0000-4000-8000-000000000008', 'Core Team Member', 5)
on conflict (id) do nothing;

insert into public.team_members
  (id, name, designation, bio, department, year, image, linkedin, github, current, sort_order)
values
  ('20000000-0000-4000-8000-000000000001', 'Alex Sample', 'Club Lead', 'Sample profile — replace via Admin → Team.', 'CSE', 'Third year', '', '', '', true, 1),
  ('20000000-0000-4000-8000-000000000002', 'Jordan Demo', 'Co-Lead', 'Sample profile — replace via Admin → Team.', 'CSE', 'Third year', '', '', '', true, 2),
  ('20000000-0000-4000-8000-000000000003', 'Sam Placeholder', 'Technical Lead', 'Sample profile — replace via Admin → Team.', 'CSE', 'Second year', '', '', '', true, 3),
  ('20000000-0000-4000-8000-000000000004', 'Riya Example', 'Design Lead', 'Sample profile — replace via Admin → Team.', 'IT', 'Second year', '', '', '', true, 4),
  ('20000000-0000-4000-8000-000000000005', 'Kai Mockwell', 'Club Lead', 'Sample profile of a former member — replace via Admin → Team.', 'CSE', 'Final year', '', '', '', false, 5)
on conflict (id) do nothing;

insert into public.events
  (id, title, description, date, time, venue, category, status, published, cover, highlights, links)
values
  (
    '30000000-0000-4000-8000-000000000001',
    'Jetpack Compose Workshop (sample)',
    'Illustrative event: a hands-on introduction to building declarative UIs with Jetpack Compose.',
    '2026-11-14', '10:00', 'Academic Block, Room A-204 (sample)', 'Workshop', 'upcoming', true,
    '/seed/cover-1.svg',
    array['Live-coding walkthrough', 'Starter project provided', 'Q&A with the tech team'],
    '{}'::text[]
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    'Mobile Build-a-thon (sample)',
    'Illustrative event: a one-day team build-a-thon for mobile app ideas.',
    '2026-12-05', '09:00', 'Innovation Lab (sample)', 'Hackathon', 'upcoming', true,
    '/seed/cover-2.svg',
    array['Teams of up to four', 'Mentor check-ins', 'Demo round'],
    '{}'::text[]
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    'Kotlin Study Jam (sample)',
    'Illustrative past event with sample photographs, shown to demonstrate how history is archived.',
    '2026-09-12', '14:00', 'Seminar Hall 2 (sample)', 'Study Jam', 'completed', true,
    '/seed/cover-3.svg',
    array['Kotlin basics to coroutines', 'Pair-programming exercises'],
    '{}'::text[]
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    'Android 101 Intro Session (sample)',
    'Illustrative past event introducing new members to the club.',
    '2026-08-22', '16:00', 'Auditorium (sample)', 'Talk', 'completed', true,
    '/seed/cover-4.svg',
    array['Club overview', 'Setting up Android Studio'],
    '{}'::text[]
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    'Draft: Native vs Cross-platform Talk',
    'Unpublished draft — only visible in the admin dashboard.',
    '2027-01-10', '15:00', 'TBD', 'Talk', 'upcoming', false,
    '/seed/cover-2.svg',
    '{}'::text[],
    '{}'::text[]
  )
on conflict (id) do nothing;

insert into public.event_images (id, event_id, kind, url, alt, position) values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', 'gallery', '/seed/gallery-1.svg', 'Kotlin Study Jam (sample) – illustrative photo 1', 0),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003', 'gallery', '/seed/gallery-2.svg', 'Kotlin Study Jam (sample) – illustrative photo 2', 1),
  ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', 'gallery', '/seed/gallery-3.svg', 'Kotlin Study Jam (sample) – illustrative photo 3', 2),
  ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000003', 'gallery', '/seed/gallery-4.svg', 'Kotlin Study Jam (sample) – illustrative photo 4', 3),
  ('40000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000004', 'gallery', '/seed/gallery-1.svg', 'Android 101 Intro Session (sample) – illustrative photo 1', 0),
  ('40000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000004', 'gallery', '/seed/gallery-2.svg', 'Android 101 Intro Session (sample) – illustrative photo 2', 1),
  ('40000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000004', 'gallery', '/seed/gallery-3.svg', 'Android 101 Intro Session (sample) – illustrative photo 3', 2)
on conflict (id) do nothing;

insert into public.event_organizers (event_id, member_id) values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001'),
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000004'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000005'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000005'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000004'),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000001')
on conflict (event_id, member_id) do nothing;

insert into public.announcements
  (id, title, message, published_on, expires_on, published, featured, event_id, cta_label, cta_url, registration_url, image, links)
values
  (
    '50000000-0000-4000-8000-000000000001',
    'Compose workshop registrations are being planned',
    'Sample announcement: details for the Jetpack Compose workshop will be shared soon.',
    '2026-10-20', null, true, true,
    '30000000-0000-4000-8000-000000000001', 'View event', '', '', '',
    '{}'::text[]
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    'Core team applications (sample)',
    'Sample announcement showing a compact card.',
    '2026-10-10', null, true, false,
    null, '', '', '', '', '{}'::text[]
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    'Expired sample notice',
    'Hidden on the public site because it expired.',
    '2026-09-01', '2026-09-30', true, false,
    null, '', '', '', '', '{}'::text[]
  ),
  (
    '50000000-0000-4000-8000-000000000004',
    'Unpublished draft',
    'Visible only in admin.',
    '2026-10-25', null, false, false,
    null, '', '', '', '', '{}'::text[]
  )
on conflict (id) do nothing;

