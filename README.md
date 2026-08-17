# SALES OS

> Plateforme de gestion et pilotage commercial — Architecture Implementation-Ready

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-blue?logo=prisma)
![Redis](https://img.shields.io/badge/Redis-7-red?logo=redis)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)

---

## Vue d'ensemble

SALES OS centralise l'ensemble du cycle de vente d'une entreprise — de la gestion des clients au suivi des commissions, en passant par les commandes, ventes, paiements et stocks.

### Modules V1 (Implémentés)

| Domaine | Modules | Statut |
|---------|---------|--------|
| **Platform** | Auth, Tenants, Users, RBAC, Houses, Audit | ✅ Implémenté |
| **Business** | CRM, Products, Orders, Sales, Payments, Stock, Commissions | ✅ Implémenté |
| **Intelligence** | Targets, Dashboard, Reporting | ✅ Implémenté |

### Modules Futurs (Différés)

Digital Commerce, SaaS multi-entreprise, IA/Recommandations, Mobile, API publique

---

## Architecture

```
SALES OS
├── PLATFORM          ← Auth, Tenants, Users, RBAC, Houses, Audit
├── BUSINESS          ← CRM, Orders, Sales, Payments, Stock, Commissions
└── INTELLIGENCE      ← Targets, Dashboard, Analytics
        │
        ▼
    PostgreSQL (Source of Truth)
        │
    ┌───┴───┐
    Redis   Storage
```

**Approche :** Monolithe modulaire avec frontières claires, déployé en une seule application. Chaque module peut être extrait ultérieurement en service indépendant.

---

## Stack Technique

| Composant | Technologie | Rôle |
|-----------|------------|------|
| Frontend | Next.js 16 / React 19 | Interface utilisateur SSR/CSR |
| Base de données | SQLite (dev) / PostgreSQL (prod) | Source de vérité |
| ORM | Prisma 6 | Requêtes typées, migrations |
| Auth | NextAuth.js v4 | Authentification JWT + Credentials |
| Cache / Events | Redis 7 | Cache, jobs, transport d'événements |
| UI | shadcn/ui + Tailwind CSS 4 | Composants + styling |
| State | Zustand + TanStack Query | Client + server state |

---

## Structure du Projet

```
sales-os/
├── src/
│   ├── app/                    ← Next.js App Router
│   │   ├── api/                ← 23 API endpoints
│   │   │   ├── auth/           ← NextAuth
│   │   │   ├── tenants/        ← CRUD
│   │   │   ├── users/          ← CRUD
│   │   │   ├── houses/         ← CRUD
│   │   │   ├── agents/         ← CRUD
│   │   │   ├── customers/      ← CRUD
│   │   │   ├── products/       ← CRUD
│   │   │   ├── orders/         ← CRUD + Order Engine
│   │   │   ├── sales/          ← CRUD
│   │   │   ├── payments/       ← CRUD
│   │   │   ├── stock/          ← CRUD
│   │   │   ├── commissions/    ← Commission Engine
│   │   │   ├── targets/        ← CRUD
│   │   │   └── stats/          ← Dashboard aggregation
│   │   ├── login/              ← Page d'authentification
│   │   └── page.tsx            ← Dashboard principal
│   ├── lib/
│   │   ├── db.ts               ← Prisma client singleton
│   │   ├── auth.ts             ← NextAuth configuration
│   │   ├── rbac.ts             ← Permission matrix (6 rôles × 18 actions)
│   │   ├── events.ts           ← Redis event bus
│   │   ├── audit.ts            ← Audit logger
│   │   ├── tenant.ts           ← Tenant isolation helper
│   │   └── engines/
│   │       ├── order-engine.ts       ← Pricing + Allocation + Fulfillment
│   │       └── commission-engine.ts  ← Calculate + Validate + Pay
│   └── modules/
│       ├── platform/           ← Module Platform
│       ├── business/           ← Module Business
│       └── intelligence/       ← Module Intelligence
├── prisma/
│   ├── schema.prisma           ← 16 tables
│   └── seed.ts                 ← Données de démonstration
└── sales-os-pdf/               ← Documents PDF (cahier des charges, architecture, estimation)
```

---

## Moteurs Métier

### Order Engine — Façade

```
ORDER ENGINE
├── Pricing Engine      ← Calcul des totaux, remises
├── Allocation Engine   ← Attribution à une maison
└── Fulfillment Engine  ← Transitions de statut
```

**Statuts :** `draft → formalized → confirmed → completed | cancelled`

### Commission Engine — Bounded Context

```
Sale → Eligibility → Rule → Calculation → Commission → Validation → Payment
```

V1 : commission simple par pourcentage agent. V2 : paliers, bonus, partage apporteur/vendeur.

---

## RBAC — Matrice de Permissions

| Action | SuperAdmin | Admin | Manager | Agent | Caissier | Lecteur |
|--------|:----------:|:-----:|:-------:|:-----:|:--------:|:-------:|
| Gérer tenants | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Gérer utilisateurs | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Créer commandes | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Valider commandes | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Enregistrer paiements | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| Voir commissions | ✓ | ✓ | ✓ | ✓(propres) | ✗ | ✓ |
| Voir dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Démarrage Rapide

### Prérequis
- Node.js 20+ ou Bun
- Redis (optionnel pour le développement)

### Installation

```bash
# Cloner le repo
git clone https://github.com/AlterEgo095/sales-os.git
cd sales-os

# Installer les dépendances
bun install

# Configurer l'environnement
cp .env.example .env

# Synchroniser la base de données
bun run db:push

# Insérer les données de démo
bunx tsx prisma/seed.ts

# Lancer le serveur de développement
bun run dev
```

### Identifiants de Démo

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | `admin@salesos.com` | `admin123` |
| Manager | `manager@salesos.com` | `manager123` |
| Agent | `agent@salesos.com` | `agent123` |

### Accès

- **Dashboard** : http://localhost:3000
- **Login** : http://localhost:3000/login
- **API** : http://localhost:3000/api/stats

---

## API Endpoints

| Méthode | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/tenants` | Liste / Création tenants |
| GET/PUT/DELETE | `/api/tenants/[id]` | CRUD tenant |
| GET/POST | `/api/users` | Liste / Création utilisateurs |
| GET/PUT/DELETE | `/api/users/[id]` | CRUD utilisateur |
| GET/POST | `/api/houses` | Liste / Création maisons |
| GET/PUT/DELETE | `/api/houses/[id]` | CRUD maison |
| GET/POST | `/api/agents` | Liste / Création agents |
| GET/PUT/DELETE | `/api/agents/[id]` | CRUD agent |
| GET/POST | `/api/customers` | Liste / Création clients |
| GET/PUT/DELETE | `/api/customers/[id]` | CRUD client |
| GET/POST | `/api/products` | Liste / Création produits |
| GET/PUT/DELETE | `/api/products/[id]` | CRUD produit |
| GET/POST | `/api/orders` | Liste / Création commandes (avec Order Engine) |
| GET/PUT/DELETE | `/api/orders/[id]` | CRUD commande +" |
| GET/POST | `/api/sales` | Liste / Création ventes |
| GET/POST | `/api/payments` | Liste / Création paiements |
| GET/POST | `/api/stock` | Liste / Mise à jour stock |
| GET/POST | `/api/commissions` | Liste / Calcul commissions |
| GET/POST | `/api/targets` | Liste / Création objectifs |
| GET | `/api/stats` | Statistiques dashboard |

---

## Sécurité — Défense en Profondeur

```
Utilisateur → Authentication → RBAC → Tenant Context → Business Authorization → PostgreSQL RLS → Data
```

5 barrières de sécurité. Le contexte tenant est propagé à chaque requête. Tests cross-tenant automatisés en CI/CD.

---

## Roadmap

| Version | Période | Contenu |
|---------|---------|---------|
| **V1** | Actuel | Commercial Core — 14 modules, moteurs, audit, multi-tenant |
| **V2** | +2-3 mois | Commissions avancées, stocks avancés, notifications, analytics |
| **V3** | +2-3 mois | Temps réel, event processing, automatisations |
| **V4** | Vision | Digital Commerce, SaaS, IA, Mobile, API publique |

---

## Documents de Référence

Les documents PDF de référence sont disponibles dans le dossier `sales-os-pdf/` :

- **Cahier des Charges** — 32 pages, spécifications complètes
- **Architecture de Référence** — 24 pages, implementation-ready
- **Estimation Investissement** — 6 pages, budget 627 USD / 20 jours

---

## Licence

Propriétaire — Tous droits réservés.

---

*SALES OS — Noyau commercial solide, frontières ouvertes.*
