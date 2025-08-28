# COTTO Pre-Launch Site

Minimal pre-launch website to capture waitlist signups.

## Quickstart

1. Copy `.env.local.example` to `.env.local` and fill in values:
   - `NEXT_PUBLIC_KLAVIYO_COMPANY_ID` — from Klaviyo account settings
   - `NEXT_PUBLIC_GA_MEASUREMENT_ID` — GA4 Measurement ID (e.g. `G-XXXXXX`)
2. `npm run dev`
3. Visit http://localhost:3000

## Brand Tokens

Defined in `src/app/globals.css` using CSS variables for colors and fonts.

## Klaviyo

Embedded form with ID `WsTrqm` is loaded via `KlaviyoForm` and styled to use brand colors.

## Deployment

Deploy on Vercel. Set the two env vars above in Vercel project settings.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
