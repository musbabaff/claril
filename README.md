# Claril — Universal Multi-Agent Document Intelligence Platform

<p align="center">
  <img src="docs/screenshots/admin-overview.png" alt="Claril Dashboard Hero" width="90%" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />
</p>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-15.1.7-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Database%20%26%20Auth-green?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License" /></a>
</p>

---

## 🌟 What is Claril?

**Claril** is a domain-agnostic, production-grade universal document intelligence platform. Driven by an advanced **multi-provider vision AI model** pipeline and coordinate **multi-agent reasoning streams**, Claril bridges the gap between raw document uploads (PDFs, scans, invoices, clinical charts) and audit-ready, structured analysis.

Unlike vertical-specific extraction tools, Claril is built with extreme adaptability. By changing domain schema mappings, the platform instantly morphs from a corporate tax auditing suite into a medical charts summarizer or a mortgage risk assessment ledger. It empowers compliance analysts, financial controllers, and administrators to extract high-fidelity structures, engage in conversational AI chat over multi-file contexts, and track operational workloads down to the cent.

---

## 📸 Platform Showcases

### Multi-Agent Interaction & Analytics
````carousel
![Document Ingestion In Queue](docs/screenshots/01-extraction-empty.png)
<!-- slide -->
![Ingestion Vision Extraction Processing](docs/screenshots/02-extraction-processing.png)
<!-- slide -->
![Vision Extraction Extracted Fields View](docs/screenshots/03-extraction-completed.png)
<!-- slide -->
![Multi-Agent Live Chat & Context Synthesis](docs/screenshots/chat-stream.png)
````

### Administrative Control Hubs
````carousel
![Admin Panel Workspace Metrics](docs/screenshots/admin-overview.png)
<!-- slide -->
![Admin User & Domain Registrations](docs/screenshots/admin-users.png)
<!-- slide -->
![Admin Interactive Inspect Profile](docs/screenshots/admin-user-inspect.png)
<!-- slide -->
![Admin Case Ingestions Grid](docs/screenshots/admin-cases.png)
<!-- slide -->
![Admin API usage logs & cost charts](docs/screenshots/admin-ai-usage.png)
<!-- slide -->
![Admin Detailed System Audit Trail](docs/screenshots/admin-audit.png)
<!-- slide -->
![Admin Feature-Flag Override Configs](docs/screenshots/admin-settings.png)
````

---

## ✨ Key Features

* **📁 Secured Multi-Tenant Storage:** Direct document uploads configured on top of **Supabase Storage** with folder-level **Row Level Security (RLS)** isolation.
* **👁️ Multi-Provider Vision AI:** Modular, provider-agnostic engine support for **Anthropic (Claude 3.5 Sonnet)**, **Google (Gemini 1.5 Pro/Flash)**, and **OpenAI (GPT-4o)**. Ingests raw formats and outputs structured JSON structures.
* **🧠 Multi-Agent Analysis Streams:** Real-time reasoning stream coordinating specialized agents—including the Data Auditor, Financial Compliance Officer, and Domain Synthesis Agent—complete with live Markdown reasoning blocks.
* **💬 Conversational AI Chat:** Deep multi-document conversational memory interface for real-time natural language query runs against extracted document fields.
* **🌐 Multilingual by Default:** Immersive internationalization (i18n) framework covering **English (EN)**, **Azerbaijani (AZ)**, and **Turkish (TR)**.
* **👑 Full-Scale Administrative Panel:** Single-pane admin console tracking user profiles, active system-wide cases, token-level API provider usage, system audit logs, and global feature configurations.
* **✨ Premium Design Aesthetics:** Responsive dark/light visual identity emphasizing rich glassmorphism layouts, harmonious HSL palettes, and Framer Motion micro-animations.

---

## 🏗️ System Architecture

Claril features a decupled client-server architecture built on Next.js Server Actions and secure Supabase database bridges:

```mermaid
graph TD
    User([Compliance Analyst / Admin]) -->|1. Ingest Documents| UI[Claril Dashboard Interface]
    UI -->|2. Secure Upload| Storage[(Supabase Storage Bucket)]
    UI -->|3. Run Ingestion| Server[Next.js Server Actions]
    
    Server -->|4. Vision OCR & Structuring| LLM[Multi-Provider Vision Engine]
    LLM -->|OpenAI / Gemini / Claude| ExtractedData[Structured Extraction JSON]
    
    ExtractedData -->|5. Coordinate Agents| MultiAgent[Reasoning Stream Engine]
    subgraph MultiAgentEngine [Multi-Agent Analysis]
        AgentAuditor[Data Auditor]
        AgentRisk[Compliance Risk Agent]
        AgentSynthesis[Domain Synthesis Agent]
    end
    MultiAgentEngine -->|6. Run Stream Audit| StreamUI[Live Stream Synthesis UI]
    
    ExtractedData & MultiAgentEngine -->|7. Persist records| DB[(Supabase DB - Postgres)]
    DB -->|8. Real-time stats| AdminPanel[Admin Operations Dashboard]
```

---

## 🛠️ Technology Stack

* **Core Framework:** [Next.js 15.1.7 (App Router)](https://nextjs.org/) + [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
* **Styling & Components:** [Tailwind CSS v4.0](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) primitives, and [Lucide React](https://lucide.dev/) icons
* **Animations:** [Framer Motion v11](https://www.framer.com/motion/) for fluid state micro-animations
* **Authentication & Backend:** [Supabase](https://supabase.com/) (PostgreSQL Database, Auth Core, secure Storage, Realtime Listeners)
* **API Clients:** Official integration SDKs for `@anthropic-ai/sdk`, `@google/generative-ai`, and `openai`
* **Package Manager:** `pnpm` workspace structure

---

## 🚀 Getting Started

A step-by-step walkthrough for local setup. For detailed environment variables, storage setup, and production guidelines, consult the comprehensive [Building and Deploying Guide](docs/BUILD.md).

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/musbabaff/claril.git
cd claril
pnpm install
```

### 2. Configure Environment
Create a copy of our environment example at the project root and populate it with your Supabase credentials and LLM API provider keys:
```bash
cp .env.example .env.local
```

### 3. Initialize Supabase
1. Run the base tables, structure migrations, and extensions using the [AI Features Migration SQL File](MIGRATION_AI_FEATURES.sql) in your **Supabase SQL Editor**.
2. Run user profiles trigger functions and audit log parameters using the [Admin Panel Migration SQL File](MIGRATION_ADMIN_PANEL.sql) in your **Supabase SQL Editor**.
3. Create a **Private Storage Bucket** in your Supabase dashboard named exactly **`documents`**.

### 4. Create Admin Account
In the Supabase SQL Editor, run this query replacing the target email with your registered user's email to bypass middleware gating and open the admin dashboard:
```sql
UPDATE auth.users
SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'admin@example.com';
```

### 5. Launch Development Build
```bash
pnpm dev
```
Open `http://localhost:3000` to interact with Claril.

---

## 📂 Project Structure

```
├── .github/                 # GitHub workflows (CI yml), bug report/PR templates
├── app/                     # Next.js 15 routing, pages, server actions, and middleware
│   ├── api/                 # Secure background AI routes and endpoints
│   ├── dashboard/           # Analyst dashboard (cases, extraction, chat templates)
│   │   └── admin/           # Gate-protected admin panels (audit, usage, config panels)
│   ├── login/               # Portal authentication
│   └── signup/              # Portal organization registration Wizard
├── components/              # Beautiful glassmorphic UI components
│   ├── admin/               # Administrative widgets, tables, settings cards
│   └── ui/                  # Tailored layout fragments and shadcn components
├── docs/                    # Screenshots and building document libraries
│   └── screenshots/         # Core verified product interface captures
├── lib/                     # Supabase clients, multi-agent frameworks, i18n configurations
│   ├── agents/              # Stream-controllers and reasoning-agent schemas
│   ├── supabase/            # Client and server database helpers
│   └── i18n/                # Localization configurations (AZ, EN, TR)
├── public/                  # Static platform branding assets
├── MIGRATION_AI_FEATURES.sql# Base migration queries
├── MIGRATION_ADMIN_PANEL.sql# Operational administrative triggers SQL
├── package.json             # Core dependency management definitions
└── tsconfig.json            # Strict TypeScript rules configuration
```

---

## 🔐 Security & RLS Gating

Claril is built on absolute data isolation principles:
* **Row Level Security (RLS):** Every profile, case, document, and report row in Postgres contains user/org RLS triggers. Users can never read or intercept rows belonging to other registered organizations.
* **Server Action Isolation:** Sensitive API connections to LLM providers are computed strictly server-side. No API keys are ever transferred to or processed on the analyst's client browser.
* **Admin Gate Checks:** Administrative API routers are double-shielded. A global Next.js `middleware.ts` intercept checks authentication status and gates the `/dashboard/admin` routes unless a user has verified `"role": "admin"` session metadata.

---

## 🪙 AI Cost & Usage Controls

Claril treats model costs as a primary operating metric:
* **Token-Level Audit logs:** The platform tracks input and output token consumption for every vision structuring and multi-agent reasoning stream call.
* **Real-time Cost Metrics:** System administrators can track real-time visual charts analyzing aggregate LLM spend per provider or per organization, allowing easy billing limits enforcement.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

* **Mustafa Babayev** / **Sydnar Technologies**
* **GitHub:** [@musbabaff](https://github.com/musbabaff)
* **Email:** contact@sydnar.com
