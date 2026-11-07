alter table public.club_settings enable row level security;
alter table public.events enable row level security;
alter table public.event_images enable row level security;
alter table public.event_organizers enable row level security;
alter table public.team_roles enable row level security;
alter table public.team_members enable row level security;
alter table public.announcements enable row level security;
alter table public.media enable row level security;

drop policy if exists "club settings are public" on public.club_settings;
create policy "club settings are public"
  on public.club_settings
  for select
  using (true);

drop policy if exists "club settings are editable by admins" on public.club_settings;
create policy "club settings are editable by admins"
  on public.club_settings
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "published events are public" on public.events;
create policy "published events are public"
  on public.events
  for select
  using (published);

drop policy if exists "admins read all events" on public.events;
create policy "admins read all events"
  on public.events
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins insert events" on public.events;
create policy "admins insert events"
  on public.events
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "admins update events" on public.events;
create policy "admins update events"
  on public.events
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins delete events" on public.events;
create policy "admins delete events"
  on public.events
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "images of published events are public" on public.event_images;
create policy "images of published events are public"
  on public.event_images
  for select
  using (public.event_is_public(event_id));

drop policy if exists "admins read all event images" on public.event_images;
create policy "admins read all event images"
  on public.event_images
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins insert event images" on public.event_images;
create policy "admins insert event images"
  on public.event_images
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "admins update event images" on public.event_images;
create policy "admins update event images"
  on public.event_images
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins delete event images" on public.event_images;
create policy "admins delete event images"
  on public.event_images
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "organizers of published events are public" on public.event_organizers;
create policy "organizers of published events are public"
  on public.event_organizers
  for select
  using (public.event_is_public(event_id));

drop policy if exists "admins read all organizers" on public.event_organizers;
create policy "admins read all organizers"
  on public.event_organizers
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins insert organizers" on public.event_organizers;
create policy "admins insert organizers"
  on public.event_organizers
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "admins delete organizers" on public.event_organizers;
create policy "admins delete organizers"
  on public.event_organizers
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "team roles are public" on public.team_roles;
create policy "team roles are public"
  on public.team_roles
  for select
  using (true);

drop policy if exists "admins insert team roles" on public.team_roles;
create policy "admins insert team roles"
  on public.team_roles
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "admins update team roles" on public.team_roles;
create policy "admins update team roles"
  on public.team_roles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins delete team roles" on public.team_roles;
create policy "admins delete team roles"
  on public.team_roles
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "team members are public" on public.team_members;
create policy "team members are public"
  on public.team_members
  for select
  using (true);

drop policy if exists "admins insert team members" on public.team_members;
create policy "admins insert team members"
  on public.team_members
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "admins update team members" on public.team_members;
create policy "admins update team members"
  on public.team_members
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins delete team members" on public.team_members;
create policy "admins delete team members"
  on public.team_members
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "live announcements are public" on public.announcements;
create policy "live announcements are public"
  on public.announcements
  for select
  using (
    published
    and published_on <= current_date
    and (expires_on is null or expires_on >= current_date)
  );

drop policy if exists "admins read all announcements" on public.announcements;
create policy "admins read all announcements"
  on public.announcements
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins insert announcements" on public.announcements;
create policy "admins insert announcements"
  on public.announcements
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "admins update announcements" on public.announcements;
create policy "admins update announcements"
  on public.announcements
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins delete announcements" on public.announcements;
create policy "admins delete announcements"
  on public.announcements
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "admins read media" on public.media;
create policy "admins read media"
  on public.media
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins insert media" on public.media;
create policy "admins insert media"
  on public.media
  for insert
  to authenticated
  with check (public.is_admin() and uploaded_by = auth.uid());

drop policy if exists "admins delete media" on public.media;
create policy "admins delete media"
  on public.media
  for delete
  to authenticated
  using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  3145728,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media files are public" on storage.objects;
create policy "media files are public"
  on storage.objects
  for select
  using (bucket_id = 'media');

drop policy if exists "admins upload media files" on storage.objects;
create policy "admins upload media files"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "admins update media files" on storage.objects;
create policy "admins update media files"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "admins delete media files" on storage.objects;
create policy "admins delete media files"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'media' and public.is_admin());