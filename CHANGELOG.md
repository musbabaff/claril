# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-24

### Added
- **Core Framework:** Setup Next.js 15, TypeScript strict mode, and pnpm monorepo capabilities.
- **Visual Design:** Premium, modern glassmorphism UI built on Tailwind v4, shadcn/ui primitives, and Framer Motion micro-animations with light/dark theme support.
- **Secure Authentication:** Integrated Supabase Auth with custom middlewares for role gating (Admin vs Analyst vs Public).
- **Document Storage:** Integrated Supabase Storage with Row Level Security (RLS) policies for secure multi-tenant case-based uploads.
- **Multi-Provider AI Ingestion:** Built-in support for OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet, and Google Gemini 1.5 Pro/Flash vision models for high-fidelity document structure and data extraction.
- **Multi-Agent Reasoning:** Implemented a reasoning stream stream-controller that coordinates multiple specialized agents (Data Auditor, Regulatory compliance expert, and Financial analyst) to process ingested files.
- **AI Chat Over Documents:** Added conversational AI chat interface allowing real-time context-aware queries on any extracted document metadata.
- **Multi-Language Localization:** Added full internationalization support for Azerbaijan (AZ), English (EN), and Turkish (TR).
- **Comprehensive Admin Panel:** Built administrative dashboard for:
  - User and registration management.
  - Active cases overview.
  - Granular AI usage tracking and visual cost charts.
  - Audit logging of system operations.
  - Global app settings and feature-flag overrides.
- **Automated Verification:** Added a Playwright end-to-end extraction test suite validating signup, upload, extraction, and UI interactions.
- **Clean Packaging:** Documented standard license (MIT), contribution guidelines, build instructions, and security policies.
