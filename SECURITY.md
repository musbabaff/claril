# Security Policy

## Supported Versions

We actively provide security updates for the following versions of Claril:

| Version | Supported |
| :--- | :---: |
| 1.x.x |   ✓   |
| < 1.0.0 |  No   |

## Reporting a Vulnerability

We take the security of Claril very seriously. If you discover a security vulnerability, we appreciate your help in disclosing it to us responsibly. 

**Do NOT open a public GitHub issue for security-related bugs.**

Instead, please report security vulnerabilities by emailing the author directly at:
- **Email:** security@sydnar.com (or via the author's public profile contacts)

We will acknowledge receipt of your report within 48 hours and provide a detailed timeline for investigation, patch, and release.

## Our Security Architecture

Claril is built from the ground up with secure-by-default architecture:

### 1. Zero-Secrets Policy
- We enforce absolute separation of code and configuration. No API keys, database connection strings, or credentials are ever checked into version control.
- Env examples are provided in `.env.example` with empty parameters.
- Static checking is run to scan for hardcoded key leakage.

### 2. Row Level Security (RLS)
- All tables and buckets in our Supabase instance are protected by PostgreSQL **Row Level Security (RLS)**.
- Users can only read, write, or delete rows linked to their workspace organization or active user session.
- Client-side access tokens are validated on every database operation.

### 3. Role Gating & Admin Protection
- The comprehensive admin panel routes (`/dashboard/admin/*`) are heavily gated.
- A custom Next.js middleware performs server-side JWT session checking and role verification before serving any admin bundle.
- Only users explicitly marked with the `admin` flag in their user metadata in a secure auth database can bypass the gate.

### 4. Server-Side AI Execution
- All LLM operations (calls to Anthropic, OpenAI, or Google APIs) are routed exclusively through secure Next.js Server Actions or server-side API routes.
- API keys are stored strictly in server environment variables and are never transmitted or exposed to the client browser.
