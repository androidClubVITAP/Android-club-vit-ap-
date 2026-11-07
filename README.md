# ANDROID CLUB VIT-AP: Website & Admin Dashboard

A public website for **ANDROID CLUB VIT-AP** (VIT-AP University) plus an admin dashboard for managing content without touching code.

Design: black, Android green (`#3DDC84`) and white, with a Liquid Glass look: translucent panels, a full-site grid with glowing Android tiles, a glowing cursor, slow smooth scrolling, scroll-linked blur-in, and a fluid-filled hero title. The UI is unchanged from the original frontend; this iteration adds a real backend behind it.

Backend: **Supabase** — Postgres with row level security, email/password Auth, and Storage for images. The frontend remains a static React SPA that talks to Supabase directly; there is no custom API server to run or deploy.

---

## Architecture at a glance

```
Browser (React 19 + Vite SPA)
   │  supabase-js (anon key + signed-in user's JWT)
   ▼
Supabase
   ├── PostgREST  → Postgres tables guarded by row level security
   ├── Auth       → admin email/password accounts
   └── Storage    → public-read `media` bucket, admin-only writes
```

- Public visitors can read published events, live announcements, team profiles and club settings.
- Every write requires a signed-in user listed in `public.admins`; this is enforced in Postgres, not in the bundle.
- The service layer keeps the exact method names the pages already used, so components were connected without redesigning anything.

---

## Quick start

Requirements: Node.js 20.19+ (or 22+) and a Supabase project.

### 1. Install dependencies

```bash
npm install
```

### 2. Apply the database migrations

Open your Supabase project → **SQL Editor** → **New query** and run these files in order:

| Order | File | What it creates |
|---|---|---|
| 1 | `supabase/migrations/20261106000100_schema.sql` | Tables, constraints, indexes, triggers, default club settings, grants |
| 2 | `supabase/migrations/20261106000200_rls.sql` | Row level security policies, `media` Storage bucket and its policies |
| 3 | `supabase/migrations/20261106000300_functions.sql` | Atomic RPCs (event relations, team deletion/reorder, media deletion) |
| 4 | `supabase/migrations/20261106000400_admins.sql` | First-admin claim, admin invitations, admin directory RPCs |
| 5 (optional) | `supabase/seed.sql` | Sample events, team members and announcements |

All files are safe to re-run: tables are created only when missing, policies are replaced, and seed rows use fixed ids with `ON CONFLICT DO NOTHING`.

`seed.sql` is demo content only. Skip it for a clean site; the club settings row is created by the first migration and is editable from Admin → Settings. To remove the demo rows later, run `supabase/unseed.sql`: it deletes only the fixed seed ids, archives seeded members still referenced by real events, and leaves settings, admins and uploaded media untouched.

### 3. Create your account and claim admin access

1. Supabase → **Authentication** → **Users** → **Add user**. Enter the email and password you will use, and confirm the user.
2. Start the app and open `/admin`. Sign in. While `public.admins` is empty, the sign-in card shows **First-time setup**; choose **Claim admin access**. That account becomes the first admin. No SQL insert is needed.
3. Open **Admin → Admins** to invite the rest of the team by email. Existing accounts are allowlisted immediately. A new email gets a pending invitation and a Supabase sign-in link that creates the account and applies the invitation when opened.
4. Recommended hardening: after setup, disable new user sign-ups (Authentication → Providers/Settings). To invite a brand-new address while sign-ups are disabled, create that user in Authentication → Users first, then invite it; the pending invitation applies on their next sign-in.

Do the first claim immediately after creating the project, before sharing the URL. The setup card is intentionally available to the first confirmed account while no admin exists.

### 4. Enable auth emails

Password-reset and admin-invitation emails both use Supabase Auth. In Supabase → **Authentication → URL Configuration**, set the **Site URL** to your app origin and add these **Redirect URLs**:

- `http://localhost:5173/admin` and `http://localhost:5173/admin/reset-password`
- `https://your-domain.example/admin` and `https://your-domain.example/admin/reset-password`

The built-in Supabase email sender is rate-limited and only delivers to project team addresses until you configure custom SMTP (Authentication → SMTP). Do that before relying on resets or invitations in production.

### 5. Configure the frontend

```bash
copy .env.example .env.local
```

Fill in:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
VITE_ADMIN_ACCESS_KEY=admin@17
```

Both values live under Supabase → **Project Settings → API**. The anon key is safe to ship: row level security is what protects the data. Never put the `service_role` key in this app.

### 6. Run

```bash
npm run dev        # http://localhost:5173
npm run build      # type-check (tsc) + production build into dist/
npm run preview    # serve the production build locally
```

Open `/admin` and sign in with your Supabase admin account. The original hidden entrance is still available as a shortcut (below).

---

## Admin access

The dashboard lives at `/admin`. Visiting it redirects to `/admin/login`, which is now reachable directly; sign in with a Supabase Auth account that is listed in `public.admins`.

On a new database, the first confirmed account sees **First-time setup** and can claim admin with one click. After that, manage the team in **Admin → Admins**; there is no manual allowlist SQL.

The original hidden entrance still works as a shortcut:

1. On the home page, left-click the empty area to the right of the word **CLUB** in the hero title.
2. Type the access key from `VITE_ADMIN_ACCESS_KEY` (default `admin@17`). Only small `*` characters appear; a wrong key does nothing.
3. The correct key opens `/admin/login`.

If you forget the password, use **Forgot password?** on the sign-in screen. The emailed link opens `/admin/reset-password`, where you choose a new password. Resetting proves control of the email but does not grant admin rights; the account must still be in `public.admins`.

**Security note:** the access key is an easter egg, not a security boundary. It is bundled into public JavaScript and can be read by anyone, and the sign-in page is reachable without it. The dashboard and every write are protected by Supabase Auth and Postgres row level security, so knowing the key gets an attacker no data and no permissions.

Signing out clears the session; the hidden entrance remains available.

---

## Features

### Public website (`/`)

Section order: **Hero → About → What we do → Announcements → Events → Team → FAQ → Join → Contact (footer)**

- Sticky glass navbar with scroll-spy and a mobile menu.
- Hero with the club logo, a fluid-filled “ANDROID CLUB” title, live stats and the next upcoming event.
- Events with All / Upcoming / Past filters, an empty state, and a detail page at `/events/:id`.
- Event detail: highlights, organizers, a photo gallery with a keyboard-accessible lightbox, and a not-found state.
- Registration pop-up: events and announcements open a Google Form in a modal with admin-added posters and links.
- Announcements: featured and compact cards. Only published, unexpired announcements are visible publicly.
- Team: leadership shown larger, initials avatars when there is no photo, former members hidden.
- All content now comes from Postgres and survives refreshes and devices.

### Admin dashboard (`/admin`)

- **Overview:** statistics calculated from live data plus quick actions.
- **Events:** search, filter, add, edit, publish/unpublish, delete (with confirmation), cover image, gallery, highlights, organizers, registration form link, registration posters and related links.
- **Team:** add, edit, remove, reorder, mark current/former, custom designations. Removing a member who organized past events archives them as *former* in the database so event history stays intact.
- **Announcements:** create, edit, publish/unpublish, delete, publication and expiry dates, related event, CTA, registration link, image and links.
- **Admins:** claim the first admin, invite by email, resend or cancel pending invitations, and remove admins. Existing accounts are added immediately; new addresses receive a Supabase sign-in link.
- **Settings:** club name, tagline, hero text, about, mission, vision, objectives, areas, “What we do” cards, FAQs, contact email, social links and logo.
- **Password reset:** “Forgot password?” on the sign-in screen sends a Supabase recovery email; the link opens `/admin/reset-password` to set a new password.
- Images uploaded anywhere in the dashboard go to Supabase Storage and receive permanent public URLs.

---

## Project structure

```
public/
  logo.jpg                 Club logo
  seed/                    Sample gradient artwork referenced by seed.sql
src/
  main.tsx                 Routes; restores the Supabase session before first render
  index.css                Design tokens, glass styles, grid, cursor, fluid title
  types.ts                 Typed UI models (ClubSettings, EventItem, TeamMember, ...)
  smooth.ts                Smooth scrolling (Lenis) and scroll-to helper
  ui.tsx                   Shared UI: modals, forms, toasts, reveal animations,
                           cursor + background grid (Effects), useService/useAuth
  pages/
    public.tsx             Public site and event detail page
    admin.tsx              Login, dashboard, event/team/announcement managers, settings
  services/
    index.ts               The only module the UI imports services from
    client.ts              Supabase client, change bus, user-facing error mapping
    rows.ts                Database row types and row → UI model mappers
    settings.ts            clubService
    events.ts              eventService
    team.ts                teamService
    announcements.ts       announcementService
    media.ts               mediaService (Supabase Storage)
    auth.ts                authService, session cache, admin check, first-admin claim
    admins.ts              adminService: directory, invitations, removal
supabase/
  migrations/              Ordered SQL migrations (schema → RLS → functions → admins)
  seed.sql                 Optional demo content
  unseed.sql               Removes only the demo rows created by seed.sql
docs/
  BACKEND.md               Schema, policies, RPCs, service-to-table reference
```

---

## Data layer

Pages never read mock arrays or touch Supabase directly; everything goes through `src/services`. The method names and return types are unchanged from the prototype, which is why the UI needed almost no modification.

| Service | Operations | Backed by |
|---|---|---|
| `clubService` | `getClubSettings`, `updateClubSettings` | `club_settings` (singleton) |
| `eventService` | `getEvents(filters?)`, `getEventById`, `createEvent`, `updateEvent`, `deleteEvent`, `publishEvent`, `uploadEventImages`, `deleteEventImage` | `events`, `event_images`, `event_organizers` + `set_event_relations` RPC |
| `teamService` | `getTeamMembers`, `createTeamMember`, `updateTeamMember`, `deleteTeamMember`, `reorderTeamMembers`, `getTeamRoles`, `createTeamRole`, `updateTeamRole`, `deleteTeamRole` | `team_members`, `team_roles` + deletion/reorder RPCs |
| `announcementService` | `getAnnouncements({activeOnly?})`, `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`, `publishAnnouncement`, `unpublishAnnouncement` | `announcements` |
| `authService` | `login`, `setupSession`, `claimFirstAdmin`, `logout`, `getCurrentAdmin`, `verifyAccessKey`, `isUnlocked`, `requestPasswordReset`, `hasSession`, `completePasswordReset` | Supabase Auth + `admins` |
| `adminService` | `listAdmins`, `listInvites`, `invite`, `remove`, `cancelInvite`, `sendInviteEmail` | `admins`, `admin_invites` + admin RPCs; Auth magic links |
| `mediaService` | `previewImage`, `uploadImage`, `deleteImage` | Storage `media` + `media` table |

Successful writes emit a change event, so `useService` refetches and every open view updates immediately.

### Security model

- Passwords are handled entirely by Supabase Auth (bcrypt, never stored by this app).
- The `anon` role can read only published content, and only live announcements; `event_images` and `event_organizers` inherit their parent event's visibility.
- All inserts, updates and deletes require `public.is_admin()`; the client-side route guards are only a convenience.
- RPCs re-check admin membership and run atomically. A team member cited by an event cannot be hard-deleted (FK `ON DELETE RESTRICT`); the RPC archives them as former instead.
- Uploads are limited to PNG/JPEG/WebP/GIF and 3 MB by both the client and the Storage bucket; filenames are random UUIDs. Deleting an image still referenced by content is refused.
- Admin membership is changed only through `SECURITY DEFINER` RPCs. `admin_invites` has no direct REST grants. The first confirmed account may claim admin only while the allowlist is empty; after that the RPC refuses, and only existing admins can invite or remove others. A pending invitation is tied to the confirmed email and is consumed on sign-in.
- Password reset is a Supabase Auth recovery email: the link creates a short-lived session used only to call `updateUser({ password })`, then the session is ended. The link is valid once and expires; only allowlisted admins can reach the dashboard afterwards.
- Errors are mapped to short messages; Postgres detail and SQL are never shown to users.
- There are no cookies or secret keys in the frontend, so CSRF does not apply. Auth endpoints use Supabase's built-in rate limiting.

---

## Testing

What has been verified in this repository:

- `npm run build` — TypeScript strict type-check passes and Vite produces `dist/`.
- The four migrations and `seed.sql` were executed against a real PostgreSQL engine (PGlite) with Supabase's `auth` and `storage` schemas stubbed. The checks covered:
  - seed counts and default settings;
  - anonymous visitors see 4 published events (not the draft), 7 gallery images, 2 live announcements (not expired or unpublished) and all team members;
  - anonymous inserts/updates are rejected, and a signed-in non-admin cannot insert events or read the allowlist;
  - an admin sees drafts and all announcements, can insert/publish an event, replace gallery/registration images and organizers atomically, reorder the team, edit settings (stamping `updated_by`), and archive a referenced member while deleting an unreferenced one;
  - a referenced media record cannot be deleted; an unreferenced one can;
  - Storage bucket policies allow public reads and reject anonymous uploads;
  - migrations and seed can be re-run without duplicating rows;
  - `unseed.sql` removes every demo row, keeps club settings and admins, archives a seeded member still referenced by a real event, and is safe to run twice;
  - the first confirmed account can claim admin only while the allowlist is empty, and a second claim is refused;
  - admins can list the directory, invite an existing account immediately, store a pending invitation for an unknown email, accept that invitation on sign-in, cancel it, and remove another admin; self-removal and non-admin access are refused;
  - the invitations table has no direct REST grants and the new RPC execute grants are scoped correctly.

What still needs your Supabase project (credentials are not in this repository):

1. Apply the migrations, sign in with the first confirmed account and use **First-time setup → Claim admin access**.
2. Invite a second account from **Admin → Admins**, open the emailed sign-in link, and confirm it becomes an admin. Confirm a non-admin Auth account is refused admin access.
3. Create/edit/publish/delete an event, upload a cover and gallery image, and verify they appear on the public site after a refresh.
4. Request a password reset, open the emailed link, set a new password and sign in with it. This requires the redirect URL and SMTP setup above.
5. Sign out, then confirm `/admin` redirects to the sign-in screen and `/admin/login` opens directly.
6. Resize to mobile widths and check the existing responsive behaviour is unchanged.

---

## Deployment

The frontend is static. Deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages, S3 + CDN):

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_ACCESS_KEY`
- **SPA routing:** rewrite all paths to `/index.html` (React Router handles `/events/:id` and `/admin/*`).
- **Auth redirects:** add `https://your-domain/admin` and `https://your-domain/admin/reset-password` to Supabase → Authentication → URL Configuration → Redirect URLs (and set the Site URL to the production origin).
- Configure custom SMTP in Supabase before relying on password-reset or admin-invitation emails in production.

Supabase remains hosted separately; no migration of its database is required when redeploying the frontend. Keep the `service_role` key out of all build environments for this app.

---

## Customizing

- **Text and content:** edit it in Admin → Settings. Defaults live in the first migration for fresh installs.
- **Sample content:** replace or delete demo events, team members and announcements from the dashboard. `seed.sql` is never applied automatically.
- **Logo:** Admin → Settings uploads a permanent logo to Storage. To hard-code a file, replace `public/logo.jpg` and set `logoUrl` to `/logo.jpg`.
- **Colours:** design tokens are at the top of `src/index.css` (`--color-droid`, `--color-neon`, `--color-ink`, `--color-surface`, `--color-mute`). They were not changed.
- **Registration forms:** paste a full `https://docs.google.com/forms/...` link to embed it in the pop-up. Short `forms.gle` and non-Google links open in a new tab.
- **Smooth scroll feel:** change `lerp` in `src/smooth.ts`.
- **Blur-in strength:** change `BLUR` in `src/ui.tsx`.
- **Hidden entrance position:** adjust the percentages in `SecretLock` in `src/pages/public.tsx`.

See `docs/BACKEND.md` for the schema, policy matrix, RPC contracts and operational runbooks.

---

## Tech stack

React 19, Vite, TypeScript, Tailwind CSS v4, React Router, Framer Motion, Lenis, Lucide React, `simple-icons`, and `@supabase/supabase-js`.

---

## Known limitations

- The hidden-entrance access key is cosmetic; Supabase Auth and RLS are the real protection.
- Password reset and admin invitations need the Supabase redirect URLs and (for production) custom SMTP configured; the built-in email sender is heavily rate-limited.
- An invitation to a brand-new email relies on Supabase sign-ups being enabled so the magic link can create the account. With sign-ups disabled, create the user in Authentication → Users first, then invite the address; existing accounts can always be invited.
- The first-admin claim is available to any confirmed account while no admin exists. Do it immediately after applying the migrations, before sharing the URL, and keep public sign-ups disabled.
- There is still no UI for renaming or deleting team roles, although the service methods and policies exist.
- Sample events, members and announcements are illustrative; event artwork is generated SVG, not photographs.
- Browser-level end-to-end tests were not run because they need a live Supabase project. The database/RLS layer was tested separately as described above.
