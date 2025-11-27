This is a [Next.js](https://nextjs.org/) project bootstrapped with
[`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the
result.

You can start editing the page by modifying `app/page.tsx`. The page
auto-updates as you edit the file.

This project uses
[`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to
automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out
[the Next.js GitHub repository](https://github.com/vercel/next.js/) - your
feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the
[Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)
from the creators of Next.js.

Check out our
[Next.js deployment documentation](https://nextjs.org/docs/deployment) for more
details.

## Automated WMS Checks (Vercel Cron)

The application includes automated Warehouse Management System (WMS) checks that
run three times daily:

- **5:00 AM** - Morning check (before opening)
- **2:00 PM** - Afternoon check (off-peak hours)
- **11:00 PM** - Night check (after closing)

### Setup

1. The cron jobs are configured in `vercel.json` and will automatically activate
   when deployed to Vercel.

2. **Security Note**: The endpoint is accessible to anyone who knows the URL.
   For additional security:

   - The endpoint path provides basic security through obscurity
   - For production, consider adding Next.js middleware for authentication
   - Or modify the endpoint to include a secret token in the URL path

3. The cron jobs will automatically run after deployment. You can monitor them
   in the Vercel dashboard under the "Cron Jobs" section.

### What Gets Checked

The automated WMS check validates:

- Menus without ingredients configured
- Addons without ingredients configured
- Insufficient stock levels
- Items below threshold levels

Results are logged to the console and can be viewed in Vercel's function logs.
