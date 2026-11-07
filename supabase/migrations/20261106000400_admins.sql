create table if not exists public.admin_invites (
  email text primary key,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint admin_invites_email_format check (
    char_length(email) <= 320
    and email = lower(btrim(email))
    and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  )
);

alter table public.admin_invites enable row level security;
revoke all on table public.admin_invites from anon, authenticated;

create or replace function public.admin_setup_available()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public.admins);
$$;

create or replace function public.claim_first_admin()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_confirmed timestamptz;
begin
  if v_uid is null then
    raise exception 'Sign in before claiming admin access.'
      using errcode = '42501';
  end if;

  select u.email_confirmed_at into v_confirmed
  from auth.users u
  where u.id = v_uid;

  if v_confirmed is null then
    raise exception 'Confirm your email address before claiming admin access.'
      using errcode = '42501';
  end if;

  lock table public.admins in share row exclusive mode;

  if exists (select 1 from public.admins) then
    raise exception 'An admin already exists. Ask an existing admin to invite you.'
      using errcode = '42501';
  end if;

  insert into public.admins (user_id) values (v_uid);
end;
$$;

create or replace function public.accept_admin_invite()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_confirmed timestamptz;
begin
  if v_uid is null then
    return false;
  end if;

  select lower(btrim(u.email)), u.email_confirmed_at
  into v_email, v_confirmed
  from auth.users u
  where u.id = v_uid;

  if v_email is null or v_confirmed is null then
    return false;
  end if;

  if not exists (
    select 1 from public.admin_invites i where i.email = v_email
  ) then
    return false;
  end if;

  insert into public.admins (user_id) values (v_uid)
  on conflict (user_id) do nothing;

  delete from public.admin_invites where email = v_email;
  return true;
end;
$$;

create or replace function public.list_admins()
returns table (
  user_id uuid,
  email text,
  created_at timestamptz,
  is_self boolean
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    a.user_id,
    coalesce(u.email, ''),
    a.created_at,
    a.user_id = auth.uid()
  from public.admins a
  join auth.users u on u.id = a.user_id
  where public.is_admin()
  order by a.created_at, u.email;
$$;

create or replace function public.list_admin_invites()
returns table (
  email text,
  created_at timestamptz,
  invited_by text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    i.email,
    i.created_at,
    coalesce(u.email, '')
  from public.admin_invites i
  left join auth.users u on u.id = i.invited_by
  where public.is_admin()
  order by i.created_at;
$$;

create or replace function public.invite_admin(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_user_id uuid;
begin
  if not public.is_admin() then
    raise exception 'You are not allowed to invite admins.'
      using errcode = '42501';
  end if;

  if char_length(v_email) > 320
     or v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Enter a valid email address.'
      using errcode = '22023';
  end if;

  if v_email = lower(coalesce(auth.jwt() ->> 'email', '')) then
    return jsonb_build_object('status', 'self', 'email', v_email);
  end if;

  select u.id into v_user_id
  from auth.users u
  where lower(btrim(u.email)) = v_email
  limit 1;

  if v_user_id is not null then
    if exists (select 1 from public.admins a where a.user_id = v_user_id) then
      delete from public.admin_invites where email = v_email;
      return jsonb_build_object('status', 'exists', 'email', v_email);
    end if;

    insert into public.admins (user_id) values (v_user_id)
    on conflict (user_id) do nothing;

    delete from public.admin_invites where email = v_email;
    return jsonb_build_object('status', 'added', 'email', v_email);
  end if;

  insert into public.admin_invites (email, invited_by)
  values (v_email, auth.uid())
  on conflict (email) do update
    set invited_by = excluded.invited_by,
        created_at = now();

  return jsonb_build_object('status', 'pending', 'email', v_email);
end;
$$;

create or replace function public.remove_admin(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'You are not allowed to remove admins.'
      using errcode = '42501';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'You cannot remove your own admin access.'
      using errcode = '42501';
  end if;

  if not exists (select 1 from public.admins a where a.user_id = p_user_id) then
    raise exception 'Admin not found.'
      using errcode = 'P0002';
  end if;

  delete from public.admins where user_id = p_user_id;
end;
$$;

create or replace function public.cancel_admin_invite(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'You are not allowed to cancel invitations.'
      using errcode = '42501';
  end if;

  delete from public.admin_invites
  where email = lower(btrim(coalesce(p_email, '')));
end;
$$;

revoke execute on function public.admin_setup_available() from public, anon;
grant execute on function public.admin_setup_available() to anon, authenticated;

revoke execute on function public.claim_first_admin() from public, anon;
revoke execute on function public.accept_admin_invite() from public, anon;
revoke execute on function public.list_admins() from public, anon;
revoke execute on function public.list_admin_invites() from public, anon;
revoke execute on function public.invite_admin(text) from public, anon;
revoke execute on function public.remove_admin(uuid) from public, anon;
revoke execute on function public.cancel_admin_invite(text) from public, anon;

grant execute on function public.claim_first_admin() to authenticated;
grant execute on function public.accept_admin_invite() to authenticated;
grant execute on function public.list_admins() to authenticated;
grant execute on function public.list_admin_invites() to authenticated;
grant execute on function public.invite_admin(text) to authenticated;
grant execute on function public.remove_admin(uuid) to authenticated;
grant execute on function public.cancel_admin_invite(text) to authenticated;