# Upload and run on GitHub Pages

The project includes `.github/workflows/deploy.yml`. Every push to `main` installs dependencies, runs the focused verification suite, builds the frontend and deploys `dist` to GitHub Pages. Assets use relative paths, and application routes use hashes, so any repository name works.

1. Open GitHub Desktop and sign in to your GitHub account.
2. Choose File > Add local repository, then select this Recruitment Portal folder.
3. Review the Changes list, enter `Initial recruitment demo` as the commit summary and commit. The `.gitignore` excludes `node_modules` and `dist`.
4. If the current branch is not `main`, rename it to `main` using Branch > Rename.
5. Select Publish repository. Choose a name such as `recruitment-portal` and make it public for the simplest Pages setup.
6. On GitHub, open the repository's Settings > Pages. Under Build and deployment, select GitHub Actions as the Source.
7. Open Actions > Deploy recruitment demo to GitHub Pages > Run workflow and choose `main`. Subsequent pushes trigger it automatically.
8. Wait for the workflow to finish. Settings > Pages shows the published URL, normally `https://YOUR_USERNAME.github.io/recruitment-portal/`.

To publish updates, commit changes in GitHub Desktop and select Push origin. If deployment fails, open the failed workflow step to read its error. Check that Pages uses GitHub Actions and that the branch is `main`.

GitHub Pages serves only frontend files. Each visitor has their own local browser demo data; changes are not shared across visitors or devices. The hosted site opens as Super Admin, and all records and sending/payment actions remain fictional. Reset Demo restores the seed in that browser. No credentials or environment secrets are required.

For local development on a machine with Node.js 24 and npm installed, open this folder in a terminal and run:

```sh
npm install
npm run dev
```

Follow the localhost address printed by Vite. Localhost and GitHub Pages have separate browser storage.

Deployment has been prepared and checked locally. It has not been uploaded or executed on GitHub.
