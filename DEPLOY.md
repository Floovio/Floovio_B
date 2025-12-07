# Deployment Guide (Render)

This backend is ready to be deployed on [Render](https://render.com).

## Prerequisites
- A GitHub repository with this code pushed.
- A Supabase project (for Database and Auth).

## Security Check
- [x] `.env` is in `.gitignore` (Secrets won't be pushed to GitHub).
- [x] Code uses `process.env` for all sensitive values.
- [x] `package.json` has correct `build` and `start` scripts.

## Steps

1.  **Create a Web Service**
    - Go to Render Dashboard -> New -> Web Service.
    - Connect your GitHub repository.

2.  **Configure Service**
    - **Name**: `mini-billo-backend` (or similar)
    - **Runtime**: `Node`
    - **Build Command**: `npm install && npm run build`
        - This installs dependencies and runs `npx prisma generate`.
    - **Start Command**: `npm start`
        - This runs `tsx src/index.js`.

3.  **Environment Variables**
    Add the following variables in the "Environment" tab:

    | Key | Value | Description |
    | :--- | :--- | :--- |
    | `NODE_ENV` | `production` | Optimizes Express for production. |
    | `DATABASE_URL` | `postgresql://...` | Connection string from Supabase (Transaction Pooler, port 6543). |
    | `DIRECT_URL` | `postgresql://...` | Connection string from Supabase (Session Pooler, port 5432). |
    | `SUPABASE_URL` | `https://<project>.supabase.co` | Your Supabase Project URL. |
    | `SUPABASE_SERVICE_ROLE` | `eyJ...` | Your Supabase Service Role Key (Server-side only). |
    | `JWT_SECRET` | `...` | (Optional) Only if you use custom JWT signing. |
    | `CLOUDINARY_URL` | `cloudinary://...` | (Optional) If using Cloudinary. |

4.  **Deploy**
    - Click "Create Web Service".
    - Render will build and start your app.

## Notes
- **Database Migrations**: For production, you should run migrations *before* deployment or as part of a release command.
    - Recommended: Run `npx prisma migrate deploy` locally (pointing to prod DB) or set it as a "Pre-Deploy Command" in Render settings.
- **TSX in Production**: We are using `tsx` to run the server because the Prisma Client is generated as TypeScript. This is fine for this scale.
