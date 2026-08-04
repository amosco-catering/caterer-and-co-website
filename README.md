# The Caterer & Co — Amosco Event Catering Services

A full-stack catering business website built with Node.js, Express, EJS, and Supabase. Features a customer-facing booking system with an interactive availability calendar, a dynamic portfolio gallery, and package listings. Includes a password-protected admin panel for managing bookings, portfolio items, and catering packages. Deployed on Render.

**Live URL:** [https://amosco-catering-website.onrender.com](https://amosco-catering-website-jfko.onrender.com)

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Features](#features)
3. [Project Structure](#project-structure)
4. [Environment Variables](#environment-variables)
5. [How to Run Locally](#how-to-run-locally)
6. [How to Deploy](#how-to-deploy)
7. [Database Schema](#database-schema)
8. [Admin Panel Guide](#admin-panel-guide)
9. [Email Notifications](#email-notifications)
10. [Test Suite](#test-suite)
11. [Known Limitations](#known-limitations)
12. [Handoff Notes](#handoff-notes)

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
- Customer receives a confirmation email when their booking is accepted
- Customer receives a rejection email with reason when their booking is rejected

---

## Project Structure

```
project/
├── backend/
│   ├── node_modules/
│   ├── public/
│   │   ├── images/          ← static images (add favicon.png here)
│   │   ├── script.js        ← booking form validation + FullCalendar logic
│   │   └── style.css        ← all site styles
│   ├── routes/
│   │   └── routes.js        ← all Express routes (home, admin, booking, portfolio, packages)
│   ├── tests/
│   │   ├── auth.test.js     ← admin auth tests
│   │   ├── booking.test.js  ← booking system tests
│   │   ├── packages.test.js ← package manager tests
│   │   └── portfolio.test.js← portfolio manager tests
│   ├── .env                 ← environment variables (never commit this)
│   ├── index.js             ← Express server entry point
│   ├── mailer.js            ← Resend email functions
│   ├── package.json
│   └── supabaseclient.js    ← Supabase client initialization
└── frontend/
    ├── admin-bookings.ejs   ← admin bookings management page
    ├── admin-login.ejs      ← admin login page
    ├── admin-settings.ejs   ← admin settings + package manager page
    ├── index.ejs            ← main public homepage
    └── portfolio-item.ejs   ← individual portfolio detail page
```

---

## Environment Variables

Create a `backend/.env` file with the following variables:

```env
PORT=5001
SESSION_SECRET=your_session_secret_here

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

RESEND_API_KEY=your_resend_api_key
DEV_EMAIL=admin@example.com
```

### Variable Reference

| Variable | Description |
|---|---|
| `PORT` | Server port (Render sets this automatically in production) |
| `SESSION_SECRET` | Secret key for signing session cookies — use a long random string |
| `SUPABASE_URL` | Found in Supabase project → Settings → API |
| `SUPABASE_KEY` | Supabase anon/public key — used for most DB operations |
| `SUPABASE_SERVICE_KEY` | Supabase service role key — bypasses RLS, used for storage uploads |
| `RESEND_API_KEY` | Found in Resend dashboard → API Keys |
| `DEV_EMAIL` | The email address that receives admin booking notifications |

> ⚠️ **Never commit `.env` to GitHub.** It is listed in `.gitignore`.

---

## How to Run Locally

### Prerequisites
- Node.js v18+ installed
- A Supabase project set up (see [Database Schema](#database-schema))
- A Resend account with an API key

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/your-org/your-repo.git
cd your-repo
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

## How to Deploy

The site is deployed on **Render** (free tier). Render auto-deploys whenever the `main` branch is pushed to GitHub.

### Initial Setup
1. Sign up at [render.com](https://render.com)
2. Click **New → Web Service** → connect GitHub repo
3. Set:
   - **Language**: Node
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add all environment variables under the **Environment** tab
5. Click **Deploy Web Service**

### Keeping the Site Awake
Render's free tier spins down after 15 minutes of inactivity. **UptimeRobot** is set up to ping the site every 5 minutes to prevent this. If UptimeRobot is not configured, set it up at [uptimerobot.com](https://uptimerobot.com) — create a free monitor pointing to the live URL with a 5-minute interval.

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
Credentials are stored in the `admin_accounts` table in Supabase. To add or change credentials, either update the row directly in Supabase or use the Settings page once logged in.

### Managing Bookings (`/admin/bookings`)
- All bookings are listed grouped by status: **Pending**, **Accepted**, **Rejected**
- Click **Accept** to confirm a booking — customer receives a confirmation email automatically
- Click **Reject** to decline — a prompt appears for the rejection reason, which is included in the customer's email

### Managing Portfolio (`/` when logged in)
- Click **Add Portfolio Item** to create a new entry with title, description, and images
- Click any portfolio card to open the detail page
- On the detail page: **Edit Portfolio** opens a modal to update title, description, change cover image, or add new images
- Individual images can be deleted via the ✕ button on each image
- **Delete All Images** removes all images at once
- **Delete Portfolio** removes the entire portfolio item and all its images from storage

### Managing Packages (`/admin/settings`)
- Scroll to the **Package Manager** section
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
- `notifyAdminNewBooking(booking)` — sends booking details to `DEV_EMAIL` when a customer submits a booking
- `notifyCustomerAccepted(booking)` — sends confirmation to the customer's email when admin accepts
- `notifyCustomerRejected(booking, reason)` — sends rejection with reason to the customer's email

### Current Limitation
The site currently uses Resend's `onboarding@resend.dev` sender domain, which is a **test domain** with the following restriction:
- Can only send to the email address registered on the Resend account

This means:
- Admin notification emails work correctly (sent to `DEV_EMAIL` = the Resend account email)
- Customer acceptance/rejection emails are **blocked by Resend** unless the customer's email matches the Resend account email

### To Fix Before Going Live
1. Purchase a domain for the business (e.g. `thecatererandco.com`)
2. Verify the domain in the Resend dashboard under **Domains**
3. Update the `from` field in all three functions in `mailer.js`:
```js
from: "The Caterer & Co <noreply@thecatererandco.com>",
```
4. Redeploy

---

## Test Suite

Tests are written using **Jest** and **Supertest**. All test data is automatically cleaned up from Supabase after each test run.

### Running Tests
```bash
cd backend
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
- **Email**: `test@email.com`
- **Password**: `password`

> Do not delete this account from Supabase or the tests will fail.

### Notes
- Tests interact with the **live Supabase database** — there is no separate test database
- The `--forceExit` flag is used because the Express server stays open after tests; this is expected behavior
- The warning "worker process has failed to exit gracefully" is harmless

---

## Known Limitations

1. **Email sender domain** — customer-facing emails (accept/reject) are blocked until a custom domain is verified in Resend (see [Email Notifications](#email-notifications))
2. **Passwords stored as plain text** — admin passwords in `admin_accounts` are not hashed. This should be addressed before the site handles sensitive data at scale (use `bcrypt`)
3. **Single admin account** — the system supports multiple rows in `admin_accounts` but the UI only manages one set of credentials at a time
4. **No favicon** — a favicon should be added once the client provides a logo. Place the image as `backend/public/images/favicon.png` and add `<link rel="icon" type="image/png" href="/images/favicon.png" />` to the `<head>` of all five EJS files
5. **Render free tier spin-down** — mitigated by UptimeRobot but first load after inactivity may be slow
6. **Package selection in booking is static label only** — the selected package name is saved as a string; there is no FK link to the `packages` table

---

## Handoff Notes

When transferring the project to the client's accounts, the following need to be updated:

### Resend
1. Create a new Resend account with the client's email
2. Generate a new API key
3. Update `RESEND_API_KEY` in Render's environment variables
4. Update `DEV_EMAIL` in Render's environment variables to the client's email

### `mailer.js` (code change required)
The comments in `mailer.js` mark the lines that need updating:
```js
// change to ADMIN_EMAIL once passed to our client
// !!! ALSO CHANGE IN .env FILE AND render.com ENVIRONMENTS !!!
```
Replace `DEV_EMAIL` references with the new environment variable name if renamed.

### Admin Credentials
Update the admin account in Supabase (`admin_accounts` table) with the client's preferred email and password.

### GitHub
Transfer repository ownership to the client's GitHub account via **Settings → General → Transfer repository**.

### Render
Transfer the web service to the client's Render account via **Settings → Transfer Service**.

### Supabase
Transfer the project to the client's Supabase organization via **Project Settings → General → Transfer project**.

### UptimeRobot
Re-create the monitor under the client's UptimeRobot account pointing to the live Render URL.

---

## Contributors

| Name | Role |
|---|---|
| *(add your team members here)* | *(add roles here)* |

---

*Built for CSSWENG — De La Salle University*
