# SE-Project-Frontend (React + Vite)

Frontend for the SE Project — a lightweight React app built with Vite that interacts with an ML backend. This repository contains the UI, API integration helpers, and assets used by the project.

## Features
- React + Vite for fast HMR and development
- Simple structure for components, pages and services
- Environment-driven API base URL for calling the ML backend
- Basic ESLint configuration included (from template)

## Prerequisites
- Node.js 16+ (recommended)
- npm (or pnpm / yarn)
- Git (optional)

## Quick start (Windows PowerShell)
1. Clone and install
   ```powershell
   git clone <repo-url>
   cd SE-Project-Frontend
   npm install
   ```
2. Run the development server
   ```powershell
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available scripts
- `npm run dev` starts the development server.
- `npm run build` builds the app for production.
- `npm run preview` previews the production build locally.

## Customization
- Edit `src/main.jsx` to change the entry point of the app.
- Modify `vite.config.js` to configure Vite settings.
- Update `.eslintrc` to adjust ESLint rules.

## Learn More
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [ESLint Documentation](https://eslint.org/docs/user-guide/getting-started)
