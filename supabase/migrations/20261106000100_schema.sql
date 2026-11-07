create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.club_settings (
  id smallint primary key default 1 check (id = 1),
  name text not null default 'ANDROID CLUB VIT-AP',
  college text not null default 'VIT-AP University',
  tagline text not null default '',
  description text not null default '',
  about text not null default '',
  mission text not null default '',
  vision text not null default '',
  objectives text[] not null default '{}'::text[],
  areas text[] not null default '{}'::text[],
  pillars text[] not null default '{}'::text[],
  faqs text[] not null default '{}'::text[],
  email text not null default '',
  instagram text not null default '',
  linkedin text not null default '',
  github text not null default '',
  logo_url text not null default '/logo.jpg',
  hero_heading text not null default 'ANDROID CLUB',
  hero_subtitle text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint club_settings_name_len check (char_length(btrim(name)) between 1 and 120),
  constraint club_settings_college_len check (char_length(college) <= 160),
  constraint club_settings_tagline_len check (char_length(tagline) <= 240),
  constraint club_settings_description_len check (char_length(description) <= 4000),
  constraint club_settings_about_len check (char_length(about) <= 20000),
  constraint club_settings_mission_len check (char_length(mission) <= 4000),
  constraint club_settings_vision_len check (char_length(vision) <= 4000),
  constraint club_settings_objectives_len check (cardinality(objectives) <= 40),
  constraint club_settings_areas_len check (cardinality(areas) <= 40),
  constraint club_settings_pillars_len check (cardinality(pillars) <= 24),
  constraint club_settings_faqs_len check (cardinality(faqs) <= 40),
  constraint club_settings_email_format check (email = '' or email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint club_settings_instagram_url check (instagram = '' or instagram ~* '^https?://'),
  constraint club_settings_linkedin_url check (linkedin = '' or linkedin ~* '^https?://'),
  constraint club_settings_github_url check (github = '' or github ~* '^https?://'),
  constraint club_settings_logo_url_len check (char_length(logo_url) between 1 and 1000)
);

insert into public.club_settings (
  id, name, college, tagline, description, about, mission, vision,
  objectives, areas, pillars, faqs, email, instagram, linkedin, github,
  logo_url, hero_heading, hero_subtitle
) values (
  1,
  'ANDROID CLUB VIT-AP',
  'VIT-AP University',
  'Build for billions. Learn together.',
  'A student technical community at VIT-AP University for mobile developers, designers and curious builders.',
  'Android Club VIT-AP is a technical club where students learn Android and mobile development, ship projects together and explore emerging technology. Edit this text in Admin → Settings.',
  'To help every member go from first app to shipped product through hands-on workshops and peer learning.',
  'To help every member go from first app to shipped product through hands-on workshops and peer learning.',
  array[
    'Teach Android and Kotlin through practical workshops',
    'Run collaborative projects and build-a-thons',
    'Connect members with mentors and the wider developer community',
    'Encourage design-minded, accessible app development'
  ],
  array['Android development', 'Kotlin', 'Jetpack Compose', 'App design', 'Emerging tech'],
  array[
    'Workshops | Hands-on sessions on Android, Kotlin and Jetpack Compose led by members and invited speakers.',
    'Build-a-thons | Team-based hack days where ideas turn into working apps in a single day.',
    'Open projects | Club-run apps where beginners and veterans collaborate and review each other''s code.',
    'Design sprints | Learn Material Design, accessibility and UX so apps feel as good as they work.',
    'Mentorship | Seniors pair with newcomers from the first Android Studio install to the first release.',
    'Community talks | Sessions on careers, open source and emerging technology.'
  ],
  array[
    'Who can join? | Any VIT-AP student curious about mobile development, whatever their experience.',
    'Do I need to know Kotlin already? | No. Workshops start from the basics.',
    'How do I register for events? | Open an event and use its Register button; the form appears right on the page.',
    'How can I join the core team? | Watch the announcements for recruitment and take part in events.'
  ],
  '', '', '', '', '/logo.jpg',
  'ANDROID CLUB VIT-AP',
  'Workshops, build-a-thons and a community of student developers shaping what runs in your pocket.'
);

create table if not exists public.team_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  rank smallint not null default 5,
  created_at timestamptz not null default now(),
  constraint team_roles_name_len check (char_length(btrim(name)) between 1 and 80),
  constraint team_roles_rank_range check (rank between 1 and 99)
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  designation text not null,
  bio text not null default '',
  department text not null default '',
  year text not null default '',
  image text not null default '',
  linkedin text not null default '',
  github text not null default '',
  current boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_members_name_len check (char_length(btrim(name)) between 1 and 120),
  constraint team_members_designation_len check (char_length(btrim(designation)) between 1 and 80),
  constraint team_members_bio_len check (char_length(bio) <= 4000),
  constraint team_members_department_len check (char_length(department) <= 120),
  constraint team_members_year_len check (char_length(year) <= 60),
  constraint team_members_image_len check (char_length(image) <= 1000),
  constraint team_members_linkedin_url check (linkedin = '' or linkedin ~* '^https?://'),
  constraint team_members_github_url check (github = '' or github ~* '^https?://'),
  constraint team_members_order_range check (sort_order >= 0)
);

create index if not exists team_members_order_idx on public.team_members (sort_order, name);

do $$
begin
  create type public.event_status as enum ('upcoming', 'completed');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  date date not null,
  time text not null default '',
  venue text not null,
  category text not null,
  status public.event_status not null default 'upcoming',
  published boolean not null default false,
  registration_url text,
  cover text not null default '',
  highlights text[] not null default '{}'::text[],
  links text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_title_len check (char_length(btrim(title)) between 1 and 200),
  constraint events_venue_len check (char_length(btrim(venue)) between 1 and 200),
  constraint events_category_len check (char_length(btrim(category)) between 1 and 80),
  constraint events_description_len check (char_length(description) <= 20000),
  constraint events_time_format check (time = '' or time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  constraint events_registration_url check (registration_url is null or registration_url ~* '^https?://'),
  constraint events_cover_len check (char_length(cover) <= 2000),
  constraint events_highlights_len check (cardinality(highlights) <= 50),
  constraint events_links_len check (cardinality(links) <= 30)
);

create index if not exists events_public_feed_idx on public.events (published, status, date);
create index if not exists events_date_idx on public.events (date);

create or replace function public.event_is_public(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    where e.id = p_event_id
      and e.published
  );
$$;

grant execute on function public.event_is_public(uuid) to anon, authenticated;

create table if not exists public.event_images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  kind text not null default 'gallery',
  url text not null,
  alt text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint event_images_kind check (kind in ('gallery', 'registration')),
  constraint event_images_url check (char_length(url) between 1 and 2000 and url ~* '^(https?://|/)'),
  constraint event_images_alt_len check (char_length(alt) <= 300),
  constraint event_images_position_range check (position >= 0)
);

create index if not exists event_images_event_idx on public.event_images (event_id, kind, position);

create table if not exists public.event_organizers (
  event_id uuid not null references public.events (id) on delete cascade,
  member_id uuid not null references public.team_members (id) on delete restrict,
  primary key (event_id, member_id)
);

create index if not exists event_organizers_member_idx on public.event_organizers (member_id);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null default '',
  published_on date not null default current_date,
  expires_on date,
  published boolean not null default false,
  featured boolean not null default false,
  event_id uuid references public.events (id) on delete set null,
  cta_label text not null default '',
  cta_url text not null default '',
  registration_url text not null default '',
  image text not null default '',
  links text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_title_len check (char_length(btrim(title)) between 1 and 200),
  constraint announcements_message_len check (char_length(message) <= 20000),
  constraint announcements_dates check (expires_on is null or expires_on >= published_on),
  constraint announcements_cta_url check (cta_url = '' or cta_url ~* '^https?://'),
  constraint announcements_registration_url check (registration_url = '' or registration_url ~* '^https?://'),
  constraint announcements_image_len check (char_length(image) <= 2000),
  constraint announcements_links_len check (cardinality(links) <= 30),
  constraint announcements_cta_label_len check (char_length(cta_label) <= 80)
);

create index if not exists announcements_feed_idx on public.announcements (published, published_on desc);
create index if not exists announcements_event_idx on public.announcements (event_id);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  url text not null,
  name text not null,
  mime text not null,
  size integer not null,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint media_mime check (mime in ('image/png', 'image/jpeg', 'image/webp', 'image/gif')),
  constraint media_size check (size > 0 and size <= 3145728),
  constraint media_name_len check (char_length(name) between 1 and 255),
  constraint media_path_len check (char_length(path) between 1 and 500)
);

create or replace function public.set_settings_updated_by()
returns trigger
language plpgsql
as $$
begin
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists club_settings_set_updated_at on public.club_settings;
create trigger club_settings_set_updated_at
  before update on public.club_settings
  for each row execute function public.set_updated_at();

drop trigger if exists club_settings_set_updated_by on public.club_settings;
create trigger club_settings_set_updated_by
  before update on public.club_settings
  for each row execute function public.set_settings_updated_by();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

drop trigger if exists team_members_set_updated_at on public.team_members;
create trigger team_members_set_updated_at
  before update on public.team_members
  for each row execute function public.set_updated_at();

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

grant select on public.club_settings to anon, authenticated;
grant update on public.club_settings to authenticated;

grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;

grant select on public.event_images to anon, authenticated;
grant insert, update, delete on public.event_images to authenticated;

grant select on public.event_organizers to anon, authenticated;
grant insert, delete on public.event_organizers to authenticated;

grant select on public.team_roles to anon, authenticated;
grant insert, update, delete on public.team_roles to authenticated;

grant select on public.team_members to anon, authenticated;
grant insert, update, delete on public.team_members to authenticated;

grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;

grant select, insert, delete on public.media to authenticated;
grant select on public.admins to authenticated;