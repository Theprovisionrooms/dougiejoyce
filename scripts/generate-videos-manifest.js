#!/usr/bin/env node
// Scans assets/videos/ and writes assets/videos/manifest.json so videos.html can
// render a gallery without any manual step. Runs as the Cloudflare Pages "build
// command" so it happens automatically on every deploy.
//
// Usage: just drop a video file into assets/videos/ (any of the extensions below),
// commit it, push. Nothing else to touch. The title shown on the site is worked
// out from the filename, so name the file something sensible
// (e.g. "dougie-ring-walkout.mp4" -> "Dougie ring walkout").

const fs = require('fs');
const path = require('path');

const VIDEOS_DIR = path.join(__dirname, '..', 'assets', 'videos');
const MANIFEST_PATH = path.join(VIDEOS_DIR, 'manifest.json');
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.m4v', '.webm']);

function titleFromFilename(filename) {
  const base = filename.replace(path.extname(filename), '');
  const spaced = base.replace(/[_-]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function main() {
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  }

  const files = fs.readdirSync(VIDEOS_DIR).filter((f) => VIDEO_EXTENSIONS.has(path.extname(f).toLowerCase()));

  const videos = files
    .map((file) => {
      const stat = fs.statSync(path.join(VIDEOS_DIR, file));
      return {
        file,
        title: titleFromFilename(file),
        addedAt: stat.mtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(videos, null, 2) + '\n');
  console.log(`videos manifest: wrote ${videos.length} video(s) to ${path.relative(process.cwd(), MANIFEST_PATH)}`);
}

main();
