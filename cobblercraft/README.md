# CobblerCraft — Multipurpose Service Business HTML Template

A clean, modern, production-ready HTML template for service-based businesses,
demoed as a **Shoe Repair & Cobbler Shop** with a full admin dashboard.

## Features
- 15 hand-crafted HTML pages (front-end site + admin dashboard)
- TailwindCSS (CDN JIT) + a small custom design-token layer
- Light / Dark mode (persisted in localStorage, respects OS preference)
- Full RTL support — toggle with the "RTL" button in the header
- Mobile-first responsive layouts
- Semantic, accessible markup: landmarks, labels, breadcrumbs, skip-friendly structure
- SEO ready: unique title/description/canonical/OG/Twitter per page + LocalBusiness JSON-LD
- Zero build step — open any .html file directly

## Pages
| File | Description |
|---|---|
| index.html | Home 1 — general services landing |
| home-2.html | Home 2 — SaaS / digital agency niche layout |
| about.html | Team, mission, history, testimonials |
| services.html | Filterable service grid |
| service-details.html | Deep dive + materials table + FAQs + pricing |
| pricing.html | Tiers + itemised price list + FAQ |
| blog.html | Searchable / filterable article list |
| blog-details.html | Full post with sidebar, comments, related posts |
| contact.html | Map, enquiry form, contact info |
| dashboard.html | Admin: analytics, orders, users, messages |
| login.html / register.html | Auth screens |
| 404.html | Not found |
| coming-soon.html | Countdown + notify form |
| maintenance.html | Maintenance notice |

## Customising
- **Colours / fonts / radius**: `assets/css/style.css` → `:root` and `.dark` variables.
- **Behaviour**: `assets/js/main.js` (theme, RTL, menus, filters, accordions, reveal animations).
- **Going to production**: replace the Tailwind CDN script with a compiled Tailwind build
  (`npx tailwindcss -i input.css -o assets/css/tailwind.css --minify`) for best performance.
- **Forms** are front-end demos only — point them at your own endpoint or form service.

## Licence
Sold as an HTML template. Fonts via Google Fonts (OFL). Map embed via OpenStreetMap.


## Functional Login & Registration Demo

The static template includes browser-based demo authentication so login/register flows can be tested without a backend.

- Register creates a local demo account and redirects to `dashboard.html`.
- Login validates saved accounts and supports a persistent “Remember me” session.
- Password reset updates the local demo account password.
- Dashboard shows the signed-in user's name and provides Logout.
- Demo credentials: `demo@cobblercraft.com` / `Demo1234`.

> Marketplace/client integration note: browser storage is for front-end demonstration only. Connect the forms to your production authentication API/provider before handling real customer credentials.
