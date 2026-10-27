# ANDROID CLUB VIT-AP – frontend prototype
```
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```
- **Admin:** `/admin/login` → `admin@androidclub.demo` / `android-demo` (demo only, NOT real security; session lives in sessionStorage).
- **Logo:** `public/logo.jpg` (referenced by `logoUrl` in `src/services/mock.ts`, editable in Admin → Settings). The supplied file is a JPG with a white background, so it is shown inside a circle; a transparent PNG would be better.
- **Data:** in-memory mock store (resets on refresh). Uploaded images are local previews only, never permanently stored.
- **Backend later:** UI imports only from `src/services/index.ts`. Write HTTP adapters with the same method names using `API_BASE_URL` (`src/api.ts`, `VITE_API_BASE_URL`) and re-export them there.
