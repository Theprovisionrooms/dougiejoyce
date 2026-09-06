# Videos

Drop video files straight into this folder. That's it.

- Supported: `.mp4`, `.mov`, `.m4v`, `.webm`
- The filename becomes the title on the site — dashes/underscores turn into spaces
  and the first letter is capitalised. So `dougie-ring-walkout.mp4` shows up as
  "Dougie ring walkout". Rename before dropping in if you want a nicer title.
- Newest file (by commit/modified date) shows first on /videos.html.
- `manifest.json` in this folder is generated automatically — don't edit it by hand,
  it gets overwritten on every deploy.

## One-time Cloudflare Pages setting

For the manifest to regenerate automatically on every deploy, set the build command
in Cloudflare Pages → your project → Settings → Builds & deployments:

- Build command: `node scripts/generate-videos-manifest.js`
- Build output directory: `/`
- Framework preset: None

After that, the whole workflow is: drag the file in here, commit, push, done.

## A note on file size

These are served straight from Pages as static files, so keep an eye on total repo
size if a lot of long/high-res clips pile up — compress phone videos down a bit
(HandBrake, or just re-export from WhatsApp at "Standard quality" rather than "HD")
before dropping them in, for faster page loads too.
