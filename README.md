# BookVault

![BookVault Repository Hero Banner](public/github_banner.png)

<div align="center">

<img src="public/logo.png" alt="BookVault Logo" width="120" />

# BookVault
### *Your Intelligent Digital Library & Reading Sanctuary*

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-emerald?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Try_It_Now!-indigo?style=for-the-badge&logo=vercel&logoColor=white)](https://bookvault-demo.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

<p align="center">
  👉 <b><a href="https://bookvault-demo.vercel.app/">Try the Live Demo Instantly!</a></b> 👈
</p>

<p align="center">
  <a href="#-introduction">Introduction</a> •
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-folder-structure">Folder Structure</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-usage-guide">Usage Guide</a>
</p>

</div>

---

## 🌟 Introduction

**BookVault** is a premium, open-source reading tracking workspace designed to replace fragmented library tools. Combining the clean, aesthetic layout of Notion with the tracking depth of Goodreads, BookVault helps you organize your physical and digital books, log daily reading sessions, analyze reading speeds (Pages Per Minute), watch contribution heatmap calendars, and unlock gamified achievements.

Equipped with a **Dual-State Database Layer**, BookVault works completely offline-first using a local sandbox mode, queuing your data locally and automatically syncing with **Supabase Cloud Sync** once a network connection is established.

---

## 🚀 Features

### 🗂️ Personal Library & Wishlist
*   **Aesthetic Cataloging**: Display books using glassmorphic cards, custom gradient presets, or cover file uploads.
*   **Status Classification**: Organize books into *Not Started*, *Reading*, *Completed*, or *Wishlist*.
*   **Wishlist & Store Tags**: Log purchase prices, priority cues, and clickable online store links. Automatic "Move to Library" transitions recalculate cost tags instantly.

### 📊 Reading Logs & Analytics Dashboard
*   **Session Logger**: Log pages read today, record reading duration, and write notes.
*   **SVG Progress Rings**: Watch visual goal rings fill up in real time as you complete your daily page quotas.
*   **Recharts Analytics**: Inspect interactive weekly charts of pages read over time, monthly finished books, and average reading speeds.
*   **Contribution Heatmap**: A GitHub-style monthly calendar contribution grid tracking your daily reading logs.

### 🏆 Gamified Milestones & Streaks
*   **Streaks Tracker**: Keep track of consecutive reading days (Streaks) with active flame indicators.
*   **Achievement Badges**: Earn milestones like *Streak Master*, *Speed Demon*, *Bookworm I*, and *Deep Diver* based on reading speed and pages logged.

### 🔒 Authentication & Dynamic Profiles
*   **Secure Authentication**: Log in securely via Email/Password or Google OAuth (using Supabase Auth).
*   **Custom Meta Fields**: Registration form fields capture Full Name, Current Role, and DOB.
*   **Interactive Profile Modal**: Click your profile card in the sidebar to review your account details, registration metadata, and active sync settings.

### 📱 Responsive UI & Offline PWA Capabilities
*   **Collapsible Sidebar Navigation**: RETRACTS on tablet/mobile views for a clean workspace.
*   **Responsive layouts**: Tailored grids stack vertically on mobile; tables collapse into beautiful details feeds.
*   **PWA Installable**: Fully compatible with iOS Add to Home Screen and Android installation, supporting offline service caching.

---

## 📸 Screenshots & Showcase

### 📊 Dashboard Workspace (Dark Theme)
Beautiful glassmorphic charts tracking streak indicators, average reading speeds, daily page logs, and a dynamic pages-read SVG circular gauge.
![Dashboard Workspace](public/dashboard_mockup.png)

---

### 🎨 Visual Layout & App Assets
A system mock-up representing the core feature views, streaks badges, and aesthetic book cover components.
![Visual Assets Layout](public/features_illustration.png)

---

### 📐 System Architecture Diagram
Chronological data routing pipelines coordinating cloud/sandbox synchronization.
![System Architecture Diagram](public/architecture_diagram.png)

---

### 📢 Open Graph Branding
Premium brand image for social sharing card previews.
![Open Graph Brand Card](public/open_graph.png)

---

## 🛠️ Tech Stack

| Technology | Role | Rationale |
|:---|:---|:---|
| **Next.js 15 (App Router)** | Core Framework | Server components, file-based routing, and SSR middleware cookie validation. |
| **React 19** | UI Layer | Reusable, responsive interface components and client-side hooks. |
| **TypeScript** | Type Safety | Robust types preventing compile-time bugs across database models. |
| **Tailwind CSS v4** | CSS Styling | Ultra-fast rendering utility classes, custom scrollbars, and modern gradients. |
| **Supabase** | Backend-as-a-Service | PostgreSQL database tables, authentication providers, and RLS policies. |
| **Framer Motion** | UI Transitions | Staggered fade-ins, slide-overs, and smooth mobile sidebar transitions. |
| **Recharts** | Interactive Analytics | Responsive SVG visualization of daily page logs and speed statistics. |
| **Lucide React** | Graphics Icons | High-quality, clean vector icon pack. |

---

## 📐 Architecture

This diagram illustrates how BookVault routes requests, synchronizes local state storage, and coordinates authorization between the client and Supabase.

```mermaid
graph TD
    subgraph Client Browser
        A[AuthPortal / Landing Page] -->|Google / Email Auth| B(Supabase Auth Client)
        A -->|Bypass| C[SessionStorage Sandbox]
        D[Sidebar Profile Card] -->|Click| E[Profile Details Modal]
        F[Dashboard / Library / Analytics] -->|Log Pages / Add Books| G[Unified DB API src/utils/db.ts]
    end

    subgraph Core Data Layer
        G -->|If Sandbox| H[(Browser LocalStorage)]
        G -->|If Session Active| I{Network Connection}
        I -->|Online| J[Supabase Server Client]
        I -->|Offline| K[Local Sync Queue]
        K -->|Once Reconnected| J
    end

    subgraph Supabase Cloud Backend
        B -->|OAuth Tokens| L[auth.users Metadata]
        J -->|Write Data| M[(PostgreSQL DB)]
        M -->|RLS Polices| N[Row-Level Security auth.uid]
    end
```

---

## 📁 Folder Structure

```text
BookVault/
├── public/                       # Static graphics assets
│   ├── github_banner.png         # Repository Hero banner
│   └── manifest.json             # PWA app parameters configuration
├── src/
│   ├── app/                      # Next.js App Router Route tree
│   │   ├── auth/callback/        # OAuth code verification router
│   │   │   └── route.ts
│   │   ├── favicon.ico           # Default favicon
│   │   ├── globals.css           # Global CSS variables and Tailwind imports
│   │   ├── icon.png              # Custom tab book icon
│   │   ├── layout.tsx            # Root HTML body wrappers
│   │   └── page.tsx              # Main entry page dispatcher
│   ├── components/               # Core application modules
│   │   ├── Analytics.tsx         # Monthly statistics graphs
│   │   ├── AuthPortal.tsx        # Landing Page + Login modal overlay
│   │   ├── Badges.tsx            # Reading milestones logic
│   │   ├── BookForms.tsx         # Book metadata inputs
│   │   ├── CalendarView.tsx      # Heatmap calendar grid
│   │   ├── Dashboard.tsx         # Main activity log statistics
│   │   ├── History.tsx           # Session entries tables & mobile cards
│   │   ├── Library.tsx           # Book catalogs grid
│   │   ├── Notifications.tsx     # Toast notification adapter
│   │   ├── Sidebar.tsx           # Collapsible navigation panel
│   │   └── ThemeContext.tsx      # Dark / Light theme provider
│   ├── utils/                    # Data access engines
│   │   ├── db.ts                 # LocalStorage & Supabase API coordinator
│   │   └── supabase/             # Client, Server, and Middleware clients
│   │       ├── client.ts
│   │       ├── middleware.ts
│   │       └── server.ts
│   └── middleware.ts             # Global Next.js redirect middleware
├── supabase_schema.sql           # PostgreSQL Database Schema template
├── package.json
└── tsconfig.json
```

---

## ⚡ Quick Start (3-Step Run)

For a setup-free local run using the Local Storage sandbox:
```bash
git clone https://github.com/pruthvisb/BookVault.git && cd BookVault && npm install && npm run dev
```

---

## ⚙️ Installation

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18.0 or higher)
*   [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
*   A [Supabase](https://supabase.com/) Account

### 1. Clone the Repository
```bash
git clone https://github.com/pruthvisb/BookVault.git
cd BookVault
```

### 2. Install Dependencies
```bash
npm install
```

---

## 🔑 Environment Variables

Create a `.env.local` file in the root of the project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Replace `your-project-ref` and `your-publishable-key` with the credentials found under **Settings** ➔ **API** in your Supabase dashboard.

---

## 🏃 Running Locally

To run the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser. 

> [!TIP]
> To test on mobile devices connected to the same Wi-Fi, run the server and access your laptop's local IP address (e.g. `http://192.168.1.100:3000`).

---

## 🗄️ Database Setup (Supabase)

To initialize your PostgreSQL tables in Supabase:

1. Open your project in the [Supabase Console](https://supabase.com).
2. Click the **SQL Editor** tab (terminal icon with `SQL`) on the left menu.
3. Click **`+ New query`**.
4. Copy the complete SQL commands inside the [`supabase_schema.sql`](file:///d:/books/supabase_schema.sql) file in this repository and paste them into the query editor.
5. Click **`Run`** in the bottom-right corner.

This creates the `books`, `reading_logs`, and `reading_goals` tables, sets up Row-Level Security (RLS) policies linking records to `auth.users(id)`, and creates index filters for query acceleration.

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)
1. Push your code to your GitHub account.
2. Log in to [Vercel](https://vercel.com) and click **Import Project**.
3. Select your `BookVault` repository.
4. Add the environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) in the project settings.
5. Click **Deploy**.

### Add Redirect URLs to Supabase
Under **Supabase Dashboard** ➔ **Authentication** ➔ **URL Configuration**:
1. Set the **Site URL** to your new Vercel deployment URL (e.g. `https://your-app.vercel.app`).
2. In the **Redirect URLs** whitelist, add: `https://your-app.vercel.app/auth/callback`.

---

## 📖 Usage Guide

<details>
<summary><b>1. Accessing Sandbox vs Cloud Sync</b></summary>
<br />
BookVault allows you to test the app instantly without signing up. 
*   **Sandbox**: Click **Try Sandbox Mode** on the landing page. All books, logs, and goals are stored in your browser session. Closing the tab automatically clears all session data, preventing local caching bloat.
*   **Cloud Sync**: Register for a free account. Your logs are synchronized securely to PostgreSQL. If you are offline, BookVault queues your changes and writes them back to the database as soon as you reconnect.
</details>

<details>
<summary><b>2. Logging Daily Reading Sessions</b></summary>
<br />
*   Open the Dashboard or click a book in your library.
*   Click **Log Session** to open the log form.
*   Enter the number of pages you read, select the duration (in minutes), and write optional notes.
*   If you reach the final page of a book, BookVault automatically flags its status as **Completed** and updates your yearly finished goal tally.
</details>

<details>
<summary><b>3. Customizing Your Profile Details</b></summary>
<br />
*   During signup, enter your **Full Name**, **Role / Occupation**, and **DOB**.
*   Inside the application, click on the profile card located in the sidebar to slide open the **Reader Profile Modal** overlay.
*   This lets you inspect your metadata parameters, current email, and active syncing credentials in a clean overlay card.
</details>

---

## 🗺️ Future Roadmap
- [ ] **OCR Cover Scanner**: Scan ISBN barcodes or book titles directly from your mobile camera to import details.
- [ ] **Data Export**: Support one-click CSV and JSON data exports for spreadsheet analysis.
- [ ] **Social Reading Clubs**: Create shared reading rooms with friends to sync current books and compare speeds.
- [ ] **Audiobook Support**: Log progress using hours/minutes read instead of page numbers.

---

## 🧪 Quality Control & Testing

To maintain the high performance and type safety of BookVault's 60 FPS interfaces, we run the following quality verification commands:

### 1. Code Linting & Style Checks
Ensure code adheres to project style standards and Next.js parameters:
```bash
npm run lint
```

### 2. Turbopack Production Build
Validate that the entire App Router code compiles cleanly and builds optimized static bundles:
```bash
npm run build
```

---

## ❓ FAQ & Troubleshooting

<details>
<summary><b>1. Why does my dragged book snap back to its original position?</b></summary>
<br />
Make sure your grid filter / sorting dropdown is set to <b>Custom Order</b>. Natural drag-and-drop reordering is only active under custom sorting configurations. Under other sorts (e.g. Title, Progress, Date), the grid enforces its preset sort sequence.
</details>

<details>
<summary><b>2. Why are my local changes not showing up in Supabase?</b></summary>
<br />
Verify that you are logged in (Sandbox changes are strictly stored in the browser's SessionStorage and do not sync to the cloud database). If logged in and offline, BookVault queues your changes locally; they will automatically write to Supabase once an active network connection is established.
</details>

<details>
<summary><b>3. I am getting API connection errors during database setup</b></summary>
<br />
Ensure you have created the `.env.local` file in the root directory and populated it with the exact keys found under <b>Settings ➔ API</b> in your Supabase project dashboard.
</details>

<details>
<summary><b>4. How do I run SQL schema commands?</b></summary>
<br />
Ensure you copy the contents of the `supabase_schema.sql` file, open the <b>SQL Editor</b> in your Supabase dashboard, click "New query", paste the contents, and click <b>Run</b>.
</details>

---

## 🤝 Contributing

Contributions are welcome! We align with the **Contributor Covenant Code of Conduct**.

### Development Workflow
1. Fork the repository.
2. Create a clean feature branch: `git checkout -b feature/your-feature-name`.
3. Make your modifications, adhering to standard ESLint rules.
4. Run code validation checks: `npm run lint` and `npm run build`.
5. Commit your changes: `git commit -m 'feat: add some amazing feature'`.
6. Push to the branch: `git push origin feature/your-feature-name`.
7. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ✍️ Author

*   **Pruthvi** - *Initial Creator & Lead Developer* - [@pruthvisb](https://github.com/pruthvisb)

---

## 💖 Acknowledgements
*   [Supabase SSR Package](https://github.com/supabase/ssr) for Next.js authentication cookies integration.
*   [Lucide React](https://lucide.dev) for the icon library assets.
*   [Framer Motion](https://www.framer.com/motion/) for fluid page transitions.
