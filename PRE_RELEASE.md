# Pre-release checklist

Run this before every marketplace update:

```bash
npm run lint
npm run typecheck
npm test
npm run validate:release
npm run build
```

Manual checks that Obsidian reviewers often flag:

- UI text uses sentence case.
- `manifest.json` description does not contain `Obsidian`.
- `manifest.json` `authorUrl` points to the author profile/site, not the plugin repository.
- Command ids do not include the plugin id.
- `README.md`, `LICENSE`, `manifest.json`, and `versions.json` are present in the repo root.
- GitHub release tag matches `manifest.json` exactly.
- GitHub release contains `main.js`, `manifest.json`, and `styles.css` as individual assets.
- `community-plugins.json` entry matches manifest id, author, repo, and description.
- If the plugin is desktop-only, `manifest.json` sets `"isDesktopOnly": true`.
