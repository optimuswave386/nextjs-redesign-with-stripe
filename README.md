# Next.js redesign

A minimalist Next.js (App Router, TypeScript) site with a NASA Astronomy Picture of the Day hero,
themes sampled from that photo, a shop with cart and checkout flow, a portfolio, an about page and a help center.

## Run it

```bash
npm install
cp .env.example .env.local   # add your NASA key, MONGODB_URI, Stripe keys and SMTP settings
npm run seed                 # optional: loads the sample projects and products into MongoDB
npm run dev                  # http://localhost:3000
```

Only `NASA_API_KEY` is required to run the site at all (`DEMO_KEY` works, just rate-limited).
Everything else has a safe fallback for local development — see "Payments" and "Email" below.

## Make it yours

| What                                   | Where                      |
| -------------------------------------- | -------------------------- |
| Name, headline, bio, interests, links  | `src/lib/site.ts`          |
| Portfolio projects and shop products   | your MongoDB database (see below) |
| Sample data (used without a database)  | `data/projects.json`, `data/products.json` |
| How database documents are read        | `toProject` / `toProduct` in `src/lib/data.ts` |
| Help center questions                  | `src/app/help/page.tsx`    |
| Help form fields and categories        | `src/lib/help.ts`          |

## MongoDB

Set `MONGODB_URI` (and optionally `MONGODB_DB`, default `site`) in `.env.local`. With no URI set, the site
uses the sample data in `/data` so it still runs.

Collections and the fields the site reads:

- **`projects`**: `title` (required), `slug`, `summary`, `year`, `status` (`Live`, `In progress` or `Archived`),
  `tags` (array of strings), `links` (array of `{ label, href }`, http/https/mailto only), `order` (number, optional).
- **`products`**: `name` (required), `price` in **cents** (required), `id` (a slug; falls back to `slug`, then `_id`),
  `blurb`, `kind` (`print`, `digital` or `goods`; digital items skip shipping), `order` (number, optional).

Documents that are missing a required field are skipped. If your documents use different field names or
collection names, change `toProject`, `toProduct` and the two collection constants at the top of `src/lib/data.ts`.
Nothing else needs to change.

`npm run seed` adds the sample documents and never overwrites ones that already exist.

Pages re-read the database at most once a minute (`revalidate = 60`), so edits appear without a redeploy.
The cart and checkout pages get the product list from `/api/products`, and `/api/checkout` prices every order
from the database, never from what the browser sends.

## How the main pieces work

- **Splash image and skeleton.** The headline and buttons animate in straight away and never wait for the photo.
  Until the photo arrives the hero shows a shimmering skeleton in the theme colours. The image is lazy-loaded and
  fades in when ready. If NASA rate-limits, times out (6 seconds) or has no still image, the skeleton stops
  shimmering and a short note explains that the photo isn't available; it fills in on a later visit.
- **Splash image and themes.** `/api/apod` fetches NASA's APOD (cached for an hour, falls back to the last good
  response). The photo is served to the browser through `/api/apod/image` so a canvas can read its pixels. That
  route only allows NASA hosts. `src/lib/palette.ts` samples the photo, picks up to five distinct hues and builds a
  dark and a light theme for each. The header dropdown switches between them; the choice is saved in
  `localStorage`, and a small script in `layout.tsx` re-applies it before first paint so there's no flash.
  If NASA is unreachable, four built-in colours are used.
- **GSAP.** `Hero.tsx` runs one entrance sequence (headline rises word by word, then the supporting text) and a
  scroll parallax on the photo. `Intro.tsx` fills in the introduction word by word as you
  scroll. Both are skipped when the visitor prefers reduced motion.
- **Shop flow.** Shop, then cart, then checkout, then order confirmation, then order history on the profile page.
  The cart lives in `localStorage`. `POST /api/checkout` validates the cart, re-prices it from `src/lib/products.ts`
  (so a tampered cart can't change the price) and creates a Stripe Checkout Session, returning its URL. The browser
  is redirected there to pay, then Stripe redirects back to `/checkout/success?session_id=...` (or
  `/checkout?canceled=1` if the visitor backs out). The success page asks `GET /api/checkout/session` to verify the
  session with Stripe directly, records the order in `localStorage` and clears the cart — the cart is only ever
  cleared once payment has actually gone through. `POST /api/webhooks/stripe` is the reliable path: it verifies
  Stripe's signature and emails a receipt (via `src/lib/mailer.ts`) on `checkout.session.completed`, so a receipt
  still goes out even if the customer closes the tab before the redirect completes.
- **Help center.** The "Report a problem" button opens a native `<dialog>` form. It posts to `/api/help`, which
  validates the report, ignores bot submissions (honeypot field) and emails it (via `src/lib/mailer.ts` /
  nodemailer) to `SUPPORT_EMAIL`.
- **Email.** `src/lib/mailer.ts` wraps nodemailer with plain SMTP env vars, so any provider works (Gmail app
  password, SendGrid, Mailgun, Postmark, Resend's SMTP endpoint, Mailtrap for local testing). Without
  `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`/`SMTP_PORT` set, it logs the email to the console instead of sending, so
  local development still works without a mail provider.
- **Payments.** `src/lib/stripe.ts` builds a Stripe client from `STRIPE_SECRET_KEY`. Without it, `/api/checkout`
  returns a clear "payments aren't configured" error instead of crashing — useful while you're still wiring up a
  Stripe account. Use Stripe's test card `4242 4242 4242 4242`, any future expiry, any CVC, to pay in test mode.

## Setting up Stripe

1. Create a Stripe account and grab your **test** keys from
   https://dashboard.stripe.com/test/apikeys — put the secret key in `STRIPE_SECRET_KEY`.
2. Set `NEXT_PUBLIC_SITE_URL` (e.g. `http://localhost:3000` locally) — it's used to build the success/cancel URLs
   Stripe redirects back to.
3. Webhook, for local dev: install the [Stripe CLI](https://docs.stripe.com/stripe-cli), then run
   `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and copy the signing secret it prints into
   `STRIPE_WEBHOOK_SECRET`. In production, add a webhook endpoint at `https://<your-domain>/api/webhooks/stripe`
   in the Stripe dashboard for the `checkout.session.completed` event and use the signing secret it gives you.
4. Pay with the test card `4242 4242 4242 4242`, any future expiry date, any 3-digit CVC.
5. When you're ready for real payments, switch to your live keys and re-add the webhook endpoint in live mode.

## Setting up email

Fill in `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (and `SMTP_SECURE=true` if you're on port 465) with
credentials from whichever provider you use — a Gmail address with an
[app password](https://myaccount.google.com/apppasswords), SendGrid, Mailgun, Postmark, Resend's SMTP endpoint, or
Mailtrap while you're testing. `SMTP_FROM` sets the From header; `SUPPORT_EMAIL` is where help-center reports go
(defaults to the address in `src/lib/site.ts`). Leave these unset and the app still runs — it just logs emails to
the console instead of sending them.

## Before you go live

1. **Accounts.** The profile page stores details and orders in the visitor's browser only. Add real sign-in
   (for example Auth.js) and move orders to a database when you need them to follow people between devices.
2. **Help-report rate limiting.** `/api/help` validates and emails reports but has no rate limiting yet — add
   some (e.g. Upstash's rate limiter) before this is public.
3. **Image size.** The image proxy streams the photo through your server. Some hosts cap response sizes; if you hit
   that, the hero falls back to loading the image straight from NASA (you'd lose the colour sampling on those days).
4. Replace the placeholder content, product names and social links.

## Deploying

This is a standard Next.js app, so any Next.js host works (Vercel is the simplest for the App Router). In broad
strokes:

1. Push this project to a GitHub repo.
2. Import it into your host (e.g. vercel.com → Add New Project → pick the repo).
3. Add every variable from `.env.example` as an environment variable in the host's dashboard — in particular
   `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, the `SMTP_*` vars, `MONGODB_URI`, `NASA_API_KEY`, and
   `NEXT_PUBLIC_SITE_URL` set to the deployed URL (you'll know it after the first deploy; redeploy once it's set).
4. Add a Stripe webhook endpoint pointing at `https://<your-domain>/api/webhooks/stripe` (see "Setting up Stripe"
   above) and put its signing secret in `STRIPE_WEBHOOK_SECRET`.
5. Deploy. `npm run build` is the build command Vercel (and most hosts) will run automatically.
