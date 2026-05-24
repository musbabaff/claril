# Building and Deploying Claril

This document provides a detailed walkthrough for setting up, building, running, and deploying Claril in both local development and production environments.

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed and configured:
- **Node.js** (v18.x or higher, v20+ recommended)
- **pnpm** (v8.x or higher)
- **Supabase Account & Project** (for Auth, Database, Storage, and Realtime)
- **API Keys** for at least one of the LLM Providers (OpenAI, Anthropic Claude, or Google Gemini)

---

## 🔐 Environment Variables

Claril requires several environment variables for database connections, authentication, and AI-powered extraction. Copy `.env.example` to create a `.env.local` file:

```bash
cp .env.example .env.local
```

### Configuration Parameters

| Variable Name | Required | Description | Example / Recommended Value |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Your Supabase project API endpoint URL. | `https://xuhdkstfwxgpsjveybqq.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Client-side anonymous public key. | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Private service role key for admin tasks. | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `ANTHROPIC_API_KEY` | No | API key for Anthropic Claude models. | `sk-ant-api03-...` |
| `GEMINI_API_KEY` | No | API key for Google Gemini models. | `AIzaSy...` |
| `OPENAI_API_KEY` | No | API key for OpenAI GPT models. | `sk-proj-...` |
| `DEFAULT_AI_PROVIDER` | **Yes** | Default AI provider for document extraction. | `gemini` (Options: `gemini`, `anthropic`, `openai`) |

> [!WARNING]
> Never commit `.env.local` or any production secrets to version control. The `.gitignore` file is configured to protect these credentials.

---

## 💾 Supabase Setup

Claril relies heavily on Supabase for data management, user authentication, and storage. Follow these steps to initialize your Supabase backend:

### 1. Database Schema
Claril is structured around SQL schemas provided in the migration files at the root of the project:
1. Open the Supabase Dashboard and navigate to the **SQL Editor**.
2. Run the SQL script from [MIGRATION_AI_FEATURES.sql](../MIGRATION_AI_FEATURES.sql) to initialize base tables, enum classes, cases, documents, extractions, chat, and reasoning-stream tables.
3. Run the SQL script from [MIGRATION_ADMIN_PANEL.sql](../MIGRATION_ADMIN_PANEL.sql) to configure user roles, audit logs, cost trackers, settings tables, and setup trigger functions.

### 2. Storage Buckets Setup
Claril uploads user documents for extraction. You must configure a storage bucket:
1. Go to **Storage** in your Supabase Dashboard.
2. Create a bucket named exactly **`documents`**.
3. Set the bucket privacy to **Private** (recommended) or **Public** depending on your needs.
4. Enable RLS (Row Level Security) and write storage policies to restrict document access:
   - Allow authenticated users to upload documents to their own case folders.
   - Allow authenticated users to read documents in cases they own.

### 3. Granting Admin Access
To access the comprehensive admin panel, a user needs the `admin` role in their user metadata. You can grant admin access by running this SQL snippet in the Supabase SQL editor:

```sql
-- Replace the email with your registered user's email
UPDATE auth.users
SET raw_user_meta_data = 
  coalesce(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'admin@example.com';
```

---

## 🚀 Local Development

Once the database and environment variables are ready, start the application locally:

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start the Development Server
```bash
pnpm dev
```
By default, the server runs on `http://localhost:3000`. You can change this using standard Next.js parameters if needed.

---

## 🏗️ Production Build & Verification

Before deployment, it is highly recommended to run a local production build to check for compilation or linting issues:

### 1. Run Linter
```bash
pnpm lint
```

### 2. Compile and Build
```bash
pnpm build
```
This builds a highly optimized Next.js server production bundle. Ensure that it completes with zero type errors.

### 3. Run Production Server
```bash
pnpm start
```

---

## 🌐 Cloud Deployment (Vercel)

Claril is built on Next.js 15 and integrates seamlessly with Vercel:

1. **Import the repository** into Vercel.
2. Under **Environment Variables**, add all the configuration variables documented in the [Environment Variables](#-environment-variables) section above.
3. Configure the build command as `pnpm build` and framework preset as **Next.js**.
4. Click **Deploy**. Vercel will build the project and provision serverless endpoints for server action executions.

### Troubleshooting Common Deployment Issues
- **Supabase Session Errors:** Make sure your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured with absolute accuracy. Check your browser console for network failures related to Supabase calls.
- **AI Token Failures / Timeouts:** Vision analysis takes time. If extraction requests time out on Vercel's standard serverless functions (10s limit on free plans), consider upgrading Vercel functions execution limits or switching the provider to a faster model.
