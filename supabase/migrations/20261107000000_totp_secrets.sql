create table if not exists public.totp_secrets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  secret text not null,
  created_at timestamptz not null default now(),
  last_verified_at timestamptz,
  is_active boolean not null default true,
  constraint totp_secrets_secret_len check (char_length(secret) >= 32)
);

alter table public.totp_secrets enable row level security;
revoke all on table public.totp_secrets from anon, authenticated;

create or replace function public.generate_totp_secret()
returns text
language sql
stable
security definer
as $$
  select encode(decode(random(), 'hex'), 'base32');
$$;

create or replace function public.verify_totp_code(user_id uuid, code text)
returns boolean
language plpgsql
security definer
as $$
declare
  v_secret text;
  v_window integer := 30;
  v_time bigint;
  v_code text;
  v_hmac bytea;
  v_hmac_hex text;
begin
  select secret into v_secret from public.totp_secrets where user_id = $1 and is_active = true;
  if v_secret is null then
    return false;
  end if;

  select floor(extract(epoch from now()) / v_window) into v_time;

  with hmac_data as (
    select digest(v_secret::bytea, v_time::text || 'TOTP', 'sha1')
  )
  select encode(hmac_data.digest, 'hex') into v_hmac_hex from hmac_data;

  v_code := substr(v_hmac_hex, 7, 6);
  v_code := substr(v_code, 1, 1) || lpad(substr(v_code, 2), 6, '0');

  return v_code = code;
end;
$$;

grant execute on function public.generate_totp_secret() to authenticated;
grant execute on function public.verify_totp_code(uuid, text) to authenticated;
grant select, insert, update, delete on table public.totp_secrets to authenticated;

create policy "users can view their own totp secrets" on public.totp_secrets
  for select using (auth.uid() = user_id);

create policy "users can update their own totp secrets" on public.totp_secrets
  for update using (auth.uid() = user_id);
