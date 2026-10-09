# NEXA | Enterprise Intelligence

A governed executive intelligence and self-service analytics prototype for digital banking.

## 1. Overview

As banks scale, inconsistent metric definitions, fragmented reporting and unclear ownership undermine confidence in management information.

NEXA connects executive reporting, domain analytics and self-service discovery within a shared governance framework. Developed for a Lead – Business Intelligence opportunity at Mal Bank in Abu Dhabi, it combines BI operating-model thinking with a working analytics interface. It is a portfolio demonstration, not a production banking platform.

## 2. Explore NEXA

**[View the live NEXA prototype](https://nexa.michellehoang.ai/)**

Start with Executive Overview, select metrics for their definitions and controls, then explore credit exposure, customer-definition reconciliation, the dictionary and data products. Proposed measures link to catalogue definitions rather than being presented as certified KPIs.

## 3. What the prototype demonstrates

| Area | Business purpose | Implemented capability |
| --- | --- | --- |
| Executive Overview (`/`) | Establish a consistent management view | Scoreboards, business sections, target gaps and RAG statuses; comparable published history only. Certified drawers show definitions, lineage, quality results and changes when available. |
| Credit & Lending (`/credit`) | Examine origination and portfolio exposure | Origination counts, balance-weighted delinquency KPIs, exposure bars and loan-count charts. Funding conversion is indicative pending cohort validation. |
| Metric Governance (`/governance`) | Resolve cross-functional definition ambiguity | Certified Active Customer Rate, recorded lineage/changes and Finance, Product, Credit and Enterprise population reconciliation. The standalone customer-count KPI remains Proposed. |
| KPI Dictionary (`/metrics`) | Make definitions and accountability discoverable | Search, filters, certification summary and details covering ownership, formulas, sources, cadence and lineage. |
| Data Marketplace (`/data`) | Support informed data-product discovery | Product search, domain filters, ownership, classification, cadence and approval metadata; informational access dialog. Requests are not submitted or stored. |

## 4. Architecture

Built with Next.js App Router, React, TypeScript, Tailwind CSS and shared components. A reusable Supabase JavaScript client reads public aggregate and metadata API views using a publishable key. Application queries do not directly retrieve underlying customer, transaction or lending tables.

Database views supply metric values and governance metadata. Frontend mappings validate responses and calculate presentation measures such as conversion ratios, exposure shares and target gaps. Definitions, ownership and recorded controls accompany reporting.

The architecture illustration and Source/Bronze/Silver/Gold/Semantic lineage describe the intended separation of sources, datasets, metrics and consumption. This repository implements the reporting and discovery interface; it does not establish deployable ingestion pipelines, orchestration or an automated certification service.

## 5. Design principles

- **Consistent definitions:** comparable reporting requires explicit populations, periods and units.
- **Domain accountability:** named owners make reconciliation actionable.
- **Transparent calculations and lineage:** users can investigate recorded dependencies.
- **Certification and conflict resolution:** enterprise standards coexist with useful domain-specific measures; Proposed status remains visible.
- **Reusable reporting components:** shared formatting reduces inconsistent presentation.
- **Accessible discovery:** searchable catalogues, labelled charts and keyboard-operable details support investigation without implying unrestricted access.

These principles support traceable management information in a regulated bank.

## 6. First 90 days

Indicative BI priorities:

- **Days 1–30:** identify priority executive decisions, critical KPIs, accountable domain owners and source dependencies.
- **Days 31–60:** establish an initial governed metric catalogue, analytical datasets and executive reporting standards; reconcile competing definitions.
- **Days 61–90:** expand domain reporting, formalise self-service access and introduce recurring data-quality, change-control and governance routines.

These priorities depend on source readiness and stakeholder agreement, not guaranteed dates.

## 7. Running locally

Prerequisites: Node.js 22 or later, npm, and a configured Supabase project with the API views expected by the application. Database provisioning and original data-generation artifacts are not included.

```bash
npm ci
```

Create an untracked `.env.local` containing these variable names, populated with your own configuration:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The publishable key is browser-visible. Never substitute a privileged key; configure appropriate public-read permissions.

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). Validation: `npx tsc --noEmit`, `npm run lint` and `npm run build`; `npm start` serves the production build.

## 8. Scope and limitations

NEXA is a functional prototype developed using synthetic banking data to demonstrate enterprise BI capabilities, metric governance and self-service analytics.

The prototype includes illustrative governance processes, certification statuses, data quality indicators and access workflows. These demonstrate the intended operating model rather than fully automated production processes.

Reporting figures and historical trends represent synthetic scenarios, not actual banking activity.

The [synthetic-data declaration](audit/DATA_DECLARATION.md) documents the available provenance evidence and its limitations.

A production implementation would require additional controls covering data security, operational resilience, regulatory compliance and ongoing data governance.
