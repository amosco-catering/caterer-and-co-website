# The Caterer & Co — Amosco Event Catering Services

A full-stack catering business website built with Node.js, Express, EJS, and Supabase. Features a customer-facing booking system with an interactive availability calendar, a dynamic portfolio gallery, and package listings. Includes a password-protected admin panel for managing bookings, portfolio items, and catering packages. Deployed on Render.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Features](#features)
3. [Project Structure](#project-structure)
4. [Environment Variables](#environment-variables)
5. [Local Run](#local-run)
6. [Deployment](#deployment)
7. [Database Schema](#database-schema)
8. [Admin Panel Guide](#admin-panel-guide)
9. [Email Notifications](#email-notifications)
10. [Test Suite](#test-suite)
11. [Known Limitations](#known-limitations)
12. [Important URLs](#important-urls)
---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js v5 |
| Templating | EJS (Embedded JavaScript) |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| Session Management | express-session |
| File Uploads | Multer (memory storage) |
| Email Notifications | Resend API |
| Calendar UI | FullCalendar v6 |
| Image Lightbox | GLightbox |
| Deployment | Render (free tier) |
| Uptime Monitoring | UptimeRobot (free tier) |
| Testing | Jest + Supertest |

---

## Features

### Customer-Facing
- **Homepage** — hero section, portfolio gallery, packages section, booking form, contact info
- **Booking System** — interactive FullCalendar with color-coded date availability:
  - 🟢 Green — available dates
  - 🔴 Red — dates with accepted bookings
  - 🟡 Yellow — dates within the 3-day notice window (unbookable)
  - White/faded — past dates
- **Booking Rules** — minimum 3 days advance notice enforced on both frontend and backend; only accepted bookings block calendar dates
- **Portfolio Gallery** — clickable cards linking to individual portfolio detail pages with GLightbox image viewer
- **Package Listings** — dynamically rendered from the database

### Admin Panel (password-protected)
Accessible at `/admin/login` — URL is intentionally not linked anywhere on the public site.

- **Booking Management** (`/admin/bookings`) — view all bookings grouped by status (pending/accepted/rejected), accept or reject with reason
- **Portfolio Manager** — add, edit, delete portfolio items; manage individual images (add, delete, delete all); update cover image
- **Package Manager** (`/admin/settings`) — add, edit, delete catering packages with title, contents, venue styling, rates (100/75/50 pax), and notes
- **Admin Settings** (`/admin/settings`) — change admin email and password
- **Session-based Auth** — 8-hour sessions; admin controls hidden from public view via EJS `isAdmin` flag

### Email Notifications (via Resend)
- Admin receives an email on every new pending booking with full booking details

---

## Project Structure

```
project/
├── backend/
│   ├── node_modules/
│   ├── public/
│   │   ├── images/           ← static images (add favicon.png here)
│   │   ├── script.js         ← booking form validation + FullCalendar logic
│   │   └── style.css         ← all site styles
│   ├── routes/
│   │   └── routes.js         ← all Express routes (home, admin, booking, portfolio, packages)
│   ├── tests/
│   │   ├── auth.test.js      ← admin auth tests
│   │   ├── booking.test.js   ← booking system tests
│   │   ├── packages.test.js  ← package manager tests
│   │   └── portfolio.test.js ← portfolio manager tests
│   ├── .env                  ← environment variables (hidden/cached)
│   ├── index.js              ← Express server entry point
│   ├── mailer.js             ← Resend email functions
│   ├── package.json
│   └── supabaseclient.js     ← Supabase client initialization
└── frontend/
    ├── admin-bookings.ejs    ← admin bookings management page
    ├── admin-login.ejs       ← admin login page
    ├── admin-settings.ejs    ← admin settings + package manager page
    ├── index.ejs             ← main public homepage
    └── portfolio-item.ejs    ← individual portfolio detail page
```

---

## Environment Variables

Key=Value format of the hidden/cached `.env`:

```env
PORT=<port>
SESSION_SECRET=<session secret>

SUPABASE_URL=<supabase URL>
SUPABASE_KEY=<supabase key>
SUPABASE_SERVICE_KEY=<supabase service key>

RESEND_API_KEY=<resend API key>
ADMIN_EMAIL=<admin email>
TEST_EMAIL=<test email>
TEST_PASSWORD=<test password>
```

### Variable Reference

| Variable | Description |
|---|---|
| `PORT` | Server port, usually used for local testing of the website |
| `SESSION_SECRET` | Secret key for signing session cookies |
| `SUPABASE_URL` | Found in Supabase project → Settings → API |
| `SUPABASE_KEY` | Supabase public key — used for most DB operations |
| `SUPABASE_SERVICE_KEY` | Supabase service role key — bypasses RLS |
| `RESEND_API_KEY` | Found in Resend dashboard → API Keys |
| `ADMIN_EMAIL` | The email address that receives admin booking notifications |
| `TEST_EMAIL` | Used for the initial testing of admin features — now used for the test scripts |
| `TEST_PASSWORD` | Used for the initial testing of admin features — now used for the test scripts |

> The `.env` is listed in `.gitignore`. It won't be found in the repository.
> To view each variable's actual values, visit the website's Render Web Service → Environments.

---

## Local Run

### Prerequisites
- Node.js v18+ installed
- A Supabase project set up (see [Database Schema](#database-schema))
- A Resend account with an API key

### Steps

1. **Clone the repository**
```bash
git clone "https://github.com/amosco-catering/caterer-and-co-website.git"
cd caterer-and-co-website
```

2. **Install dependencies**
```bash
cd backend
npm install
```

3. **Create the `.env` file** in `backend/` with all variables listed above

4. **Start the development server**
```bash
npm run dev
```

5. **Open the site** at `http://localhost:5001`

6. **Access admin panel** at `http://localhost:5001/admin/login`

---

## Deployment

The site was deployed on **Render** (free tier). Render auto-deploys whenever the `main` branch is pushed to GitHub.

### Initial Setup
1. Signed up ADMIN_EMAIL at [render.com](https://render.com)
2. Created **New → Web Service** → connected this GitHub repo
3. Set:
   - **Language**: Node
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
4. Added all environment variables under the **Environment** tab
5. Clicked **Deploy Web Service**

### Keeping the Site Awake
Render's free tier spins down after 15 minutes of inactivity. **UptimeRobot** is set up to ping the site every 5 minutes to prevent this. To access the monitoring, sign in at [uptimerobot.com](https://uptimerobot.com) using `ADMIN_EMAIL`.

---

## Database Schema

The project uses **Supabase** (PostgreSQL). Below are the five tables:

### `admin_accounts`
```sql
create table public.admin_accounts (
  id bigint generated by default as identity primary key,
  created_at timestamp with time zone default now(),
  username character varying,
  password character varying,
  email character varying
);
```

### `booking`
```sql
create table public.booking (
  id bigint generated by default as identity primary key,
  created_at timestamp with time zone default now(),
  first_name text,
  last_name text,
  email text,
  contact_number text,
  event_type text,
  event_date date,
  venue_location text,
  number_of_guest integer,
  design_motif text,
  package text,
  status text default 'pending'
);
```

> `status` can be `'pending'`, `'accepted'`, or `'rejected'`. Only `'accepted'` bookings block the calendar.

### `portfolio`
```sql
create table public.portfolio (
  id bigint generated by default as identity primary key,
  created_at timestamp with time zone default now(),
  portfolio_title text,
  portfolio_desc text
);
```

### `portfolio_images`
```sql
create table public.portfolio_images (
  id bigint generated by default as identity primary key,
  created_at timestamp with time zone default now(),
  portfolio_id bigint,
  image_url text
);
```

> Images are stored in **Supabase Storage** under the `portfolio-images` bucket. The `image_url` column stores the public URL.

### `packages`
```sql
create table public.packages (
  id bigint generated by default as identity primary key,
  created_at timestamp with time zone default now(),
  package_title text,
  package_contents text[],
  venue_styling text[],
  rates jsonb,
  note text,
  active boolean default true
);
```

> `package_contents` and `venue_styling` are stored as PostgreSQL arrays. `rates` is stored as JSONB in the format `[{ "guests": 100, "price": 900 }, ...]`.

---

## Admin Panel Guide

### Accessing the Admin Panel
Navigate to `/admin/login` — this URL is intentionally hidden from the public site. The admin should bookmark it.

### Default Credentials
Credentials are stored in the `admin_accounts` table in Supabase. To add or change credentials, either update the row directly in Supabase or use the Settings page once logged in (i.e. no UI within the website itself to add/create new admin accounts).

### Managing Bookings (`/admin/bookings`)
- All bookings are listed grouped by status: **Pending**, **Accepted**, **Rejected**:
- Click `Book Event` and a new booking instance is immediately set as **Pending** - while the admin receives an email (via Resend)
- Click **Accept** to confirm a booking (blocks that date within the dynamic calendar)
- Click **Reject** to decline a booking (no real effect - could be better implemented)

### Managing Portfolio (`/` when logged in)
- Click **Add Portfolio Item** to create a new entry with title, description, and images
- Click any portfolio card to open the detail page
- On the detail page: **Edit Portfolio** opens a modal to update title, description, change cover image, or add new images
- Individual images can be deleted via the ✕ button on each image
- **Delete All Images** removes all images at once
- **Delete Portfolio** removes the entire portfolio item and all its images from storage

### Managing Packages (`/admin/settings`)
- Scroll down to the **Package Manager** section
- Fill in the **Add Package** form — package contents and venue styling are entered one item per line
- Existing packages are listed below with an **Edit Package** expandable section
- Click **Delete Package** to remove a package

### Admin Settings (`/admin/settings`)
- Change the admin email address under **Change Email**
- Change the admin password under **Change Password**

---

## Email Notifications

The site uses **Resend** for transactional emails. All email logic is in `backend/mailer.js`.

### How It Works
- `notifyAdminNewBooking(booking)` — sends booking details to `ADMIN_EMAIL` when a customer submits a booking
- `notifyCustomerAccepted(booking)` — unused
- `notifyCustomerRejected(booking, reason)` — unused
> **Reason for unused `notifyCustomer` features**: Resend requires a verified email domain for multiple email sending

### Current Limitation
The site currently uses Resend's `onboarding@resend.dev` sender domain, which is a **test domain** with the following restriction:
- Can only send to the email address registered on the Resend account (`ADMIN_EMAIL`)
- Admin notification took precedence over customer notification

This means:
- Admin notification emails work correctly (sent to `ADMIN_EMAIL` - the Resend account email)
- Customer acceptance/rejection emails are **blocked by Resend** unless the customer's email matches the Resend account email

---

## Test Suite

Tests are written using **Jest** and **Supertest**. All test data is automatically cleaned up from Supabase after each test run.

### Running Tests
The tests need to be ran from the `backend\` folder since that is where `package.json` is located.
```bash
cd backend
```
Before running ``npm test`` commands below, make sure to create the complete `.env` file using the Environment Variables in the Render Web Service.
```bash
npm test
```
If ``npm test`` fails, try running an ``npm install`` and ``npm audit fix`` (if needed) first.
```bash
npm install
npm audit fix
npm test
```

### Test Files

| File | What It Tests |
|---|---|
| `auth.test.js` | Admin login, logout, session protection |
| `booking.test.js` | Booking creation, 3-day rule, duplicate blocking, pending date logic |
| `portfolio.test.js` | Portfolio CRUD, auth protection, 404 handling |
| `packages.test.js` | Package CRUD, auth protection, data integrity |

### Test Admin Account
Tests use a dedicated test admin account in the `admin_accounts` table:
- **Email**: `TEST_EMAIL` (hidden for security)
- **Password**: `TEST_PASSWORD` (hidden for security)

> If deleted from Supabase, test scripts will fail.

### Notes
- Tests interact with the **live Supabase database** — there is no separate test database
- The `--forceExit` flag is used because the Express server stays open after tests; this is expected behavior
- The warning "worker process has failed to exit gracefully" is harmless

---

## Known Limitations

1. **Email sender domain** — customer-facing emails (accept/reject) are blocked until a custom domain is verified in Resend (see [Email Notifications](#email-notifications))
2. **Single admin account** — the system supports multiple rows in `admin_accounts` but the UI only manages one set of credentials at a time
3. **No favicon** — a favicon should be added once the client provides a logo. Place the image as `backend/public/images/favicon.png` and add `<link rel="icon" type="image/png" href="/images/favicon.png" />` to the `<head>` of all five EJS files
4. **Render free tier spin-down** — mitigated by UptimeRobot but first load after inactivity may be slow
5. **Package selection in booking is static label only** — the selected package name is saved as a string; there is no FK link to the `packages` table

---

## Important URLs

### Live Website URL:
- Customer View: https://amosco-catering-website-jfko.onrender.com/
- Admin Login: https://amosco-catering-website-jfko.onrender.com/admin/login

### Platforms/Services/APIs:
- Supabase: https://supabase.com/dashboard/project/enztndikvcotdepantmw
- Render: https://dashboard.render.com/web/srv-d9ok55nlk1mc739dd6d0
- UptimeRobot: https://dashboard.uptimerobot.com/monitors/803657139
- Resend: https://resend.com/emails
