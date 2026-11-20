# PCM Study Checklist

A responsive Physics, Chemistry and Mathematics checklist built with React, TypeScript, Vite and Tailwind CSS.

## Run locally

Requires Node.js 20.19+ (Node.js 22 recommended).

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
npm run preview
```

The production website is generated in `dist/`.

## Deploy to GitHub Pages

This repository includes `.github/workflows/deploy.yml`. It builds the app and deploys the `dist/` folder automatically whenever you push to the `main` branch.

1. Push the project files to your GitHub repository's `main` branch.
2. Open **Settings → Pages** in the repository.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Open the **Actions** tab and wait for **Deploy PCM Checklist to GitHub Pages** to finish.
5. Open the Pages URL shown in the workflow deployment.

Do not choose “Deploy from a branch” with the repository root for this Vite project. GitHub Pages must serve the generated `dist/` output. The Vite configuration uses relative asset paths so it works both at a project URL (`username.github.io/repository/`) and a root URL (`username.github.io/`).

## Google Drive backup (optional)

The checklist works locally in the browser without Google Drive. Drive backup additionally requires a correctly configured Firebase project, enabled Google sign-in, the deployed Pages hostname in Firebase Authentication's authorized domains, and a matching OAuth consent/client configuration. If Drive sign-in is not configured, the rest of the checklist remains usable.
