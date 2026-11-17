# Zero Cycle Trainer

Windows desktop app for practicing Minecraft Zero Cycle coordinates, Y-heights, chapters and achievements.

## Build and run locally

Requires Node.js 22 or newer.

```sh
npm install
npm start
```

## Release with automatic updates

1. Upload all project files to the repository, including `index.html`, `main.js`, `preload.js`, `package.json`, `assets/icon.ico` and `.github/workflows/release.yml`.
2. Open GitHub **Settings → Actions → General → Workflow permissions** and allow **Read and write permissions**, if not already permitted.
3. In GitHub, create a tag **v1.2.0** and publish a Release, or push the tag to run the Windows workflow. Avoid manually creating a competing release while the workflow is publishing.
4. The workflow creates the Windows NSIS installer and `latest.yml` update metadata in GitHub Releases. Install that new version once.
5. For each later version, update `package.json` and the displayed app version, then push a new `vX.Y.Z` tag. The installed app checks for releases and downloads updates; it offers **Installera och starta om** when ready.

**Important:** The previous browser-wrapper app is not Electron and cannot update itself using `electron-updater`. Install the Electron v1.2.0 build once. Progress in the older browser-wrapper version is not automatically migrated. Electron stores localStorage in its own user profile; subsequent Electron updates keep that profile.

Unsigned Windows installers may trigger SmartScreen warnings. Only install builds you trust. Do not commit API keys or tokens.
