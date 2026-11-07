create or replace function public.set_event_relations(
  p_event_id uuid,
  p_gallery jsonb default null,
  p_reg_images jsonb default null,
  p_organizers uuid[] default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'You are not allowed to change event details.'
      using errcode = '42501';
  end if;

  if not exists (select 1 from public.events where id = p_event_id) then
    raise exception 'Event not found.'
      using errcode = 'P0002';
  end if;

  if p_gallery is not null then
    delete from public.event_images
    where event_id = p_event_id and kind = 'gallery';

    insert into public.event_images (event_id, kind, url, alt, position)
    select
      p_event_id,
      'gallery',
      btrim(coalesce(item ->> 'url', '')),
      btrim(coalesce(item ->> 'alt', '')),
      (ord - 1)::integer
    from jsonb_array_elements(coalesce(p_gallery, '[]'::jsonb)) with ordinality as t(item, ord)
    where coalesce(item ->> 'url', '') <> '';
  end if;

  if p_reg_images is not null then
    delete from public.event_images
    where event_id = p_event_id and kind = 'registration';

    insert into public.event_images (event_id, kind, url, alt, position)
    select
      p_event_id,
      'registration',
      btrim(coalesce(item ->> 'url', '')),
      btrim(coalesce(item ->> 'alt', '')),
      (ord - 1)::integer
    from jsonb_array_elements(coalesce(p_reg_images, '[]'::jsonb)) with ordinality as t(item, ord)
    where coalesce(item ->> 'url', '') <> '';
  end if;

  if p_organizers is not null then
    delete from public.event_organizers where event_id = p_event_id;

    insert into public.event_organizers (event_id, member_id)
    select p_event_id, member_id
    from unnest(p_organizers) as member_id
    on conflict (event_id, member_id) do nothing;
  end if;
end;
$$;

create or replace function public.delete_team_member(p_member_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'You are not allowed to remove team members.'
      using errcode = '42501';
  end if;

  if not exists (select 1 from public.team_members where id = p_member_id) then
    raise exception 'Team member not found.'
      using errcode = 'P0002';
  end if;

  if exists (select 1 from public.event_organizers where member_id = p_member_id) then
    update public.team_members
    set current = false
    where id = p_member_id;
    return 'archived';
  end if;

  delete from public.team_members where id = p_member_id;
  return 'deleted';
end;
$$;

create or replace function public.reorder_team_members(p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  i integer;
begin
  if not public.is_admin() then
    raise exception 'You are not allowed to reorder team members.'
      using errcode = '42501';
  end if;

  for i in 1 .. coalesce(array_length(p_ids, 1), 0) loop
    update public.team_members
    set sort_order = i
    where id = p_ids[i];
  end loop;
end;
$$;

create or replace function public.delete_media(p_media_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_path text;
begin
  if not public.is_admin() then
    raise exception 'You are not allowed to delete media.'
      using errcode = '42501';
  end if;

  select url, path into v_url, v_path
  from public.media
  where id = p_media_id;

  if v_url is null then
    raise exception 'Media not found.'
      using errcode = 'P0002';
  end if;

  if exists (select 1 from public.event_images where url = v_url)
     or exists (select 1 from public.events where cover = v_url)
     or exists (select 1 from public.team_members where image = v_url)
     or exists (select 1 from public.announcements where image = v_url)
     or exists (select 1 from public.club_settings where logo_url = v_url)
  then
    raise exception 'This image is still used by club content. Remove it there first.'
      using errcode = '23503';
  end if;

  delete from public.media where id = p_media_id;
  return v_path;
end;
$$;

revoke execute on function public.set_event_relations(uuid, jsonb, jsonb, uuid[]) from public, anon;
revoke execute on function public.delete_team_member(uuid) from public, anon;
revoke execute on function public.reorder_team_members(uuid[]) from public, anon;
revoke execute on function public.delete_media(uuid) from public, anon;

grant execute on function public.set_event_relations(uuid, jsonb, jsonb, uuid[]) to authenticated;
grant execute on function public.delete_team_member(uuid) to authenticated;
grant execute on function public.reorder_team_members(uuid[]) to authenticated;
grant execute on function public.delete_media(uuid) to authenticated;