# Deployment Guide (Railway)

This backend is ready to be deployed on [Railway](https://railway.app).

## Security Check
- [x] `.env` is in `.gitignore` (Secrets won't be pushed to GitHub).
- [x] Code uses `process.env` for all sensitive values.
- [x] `package.json` has correct `build` and `start` scripts.

## Steps to Deploy

1.  **Push to GitHub**
    - Commit and push your code to a new GitHub repository.
    - *Note: Do NOT push your `.env` file.*

2.  **Create Project on Railway**
    - Go to [Railway Dashboard](https://railway.app/dashboard).
    - Click "New Project" -> "Deploy from GitHub repo".
    - Select your repository.

3.  **Configure Environment Variables**
    - Railway will detect the app but might fail to start initially because of missing variables.
    - Go to the **Variables** tab in your Railway project.
    - Add the following (copy values from your local `.env` or Supabase dashboard):

    | Variable Name | Value Description |
    | :--- | :--- |
    | `NODE_ENV` | `production` |
    | `DATABASE_URL` | Connection string from Supabase (Transaction Pooler, port 6543). |
    | `DIRECT_URL` | Connection string from Supabase (Session Pooler, port 5432). |
    | `SUPABASE_URL` | `https://<project>.supabase.co` |
    | `SUPABASE_SERVICE_ROLE` | Your secret service role key. |
    | `JWT_SECRET` | (Optional) Only if using custom JWTs. |
    | `CLOUDINARY_URL` | (Optional) If using Cloudinary. |
    | `PORT` | `PORT` is automatically set by Railway, but you can set it to `8080` if needed. |

4.  **Verify Build & Deploy**
    - Railway uses **Nixpacks** to automatically detect Node.js.
    - It will run `npm install`, then `npm run build` (which runs `npx prisma generate`), and finally `npm start`.
    - Watch the "Deployments" logs. Once it says "Server listening on...", you are live!

5.  **Public URL**
    - Go to "Settings" -> "Networking" -> "Generate Domain" to get your public URL (e.g., `mini-billo-production.up.railway.app`).

## Troubleshooting
- **Build Fails?** Check if `npx prisma generate` is failing. Ensure `DATABASE_URL` is set in variables.
- **App Crashes?** Check logs for "Supabase URL missing" or DB connection errors.
