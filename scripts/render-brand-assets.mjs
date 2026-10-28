import sharp from 'sharp';
import { mkdirSync, copyFileSync } from 'fs';

mkdirSync('docs/brand', { recursive: true });
mkdirSync('public/brand', { recursive: true });

const mark = 'docs/brand/fiscalwatch-mark.svg';
const logo = 'docs/brand/fiscalwatch-logo.svg';
const logoDark = 'docs/brand/fiscalwatch-logo-on-dark.svg';

const jobs = [];
for (const size of [64, 128, 256, 512]) {
  const out = `docs/brand/fiscalwatch-mark-${size}.png`;
  jobs.push(sharp(mark).resize(size, size).png().toFile(out).then(() => {
    copyFileSync(out, `public/brand/fiscalwatch-mark-${size}.png`);
    return out;
  }));
}

jobs.push(
  sharp(logo).resize(640, 160).png().toFile('docs/brand/fiscalwatch-logo-640.png'),
  sharp(logo).resize(1280, 320).png().toFile('docs/brand/fiscalwatch-logo-1280.png'),
  sharp(logoDark).resize(640, 160).png().toFile('docs/brand/fiscalwatch-logo-on-dark-640.png'),
  sharp(logo).resize(640, 160).png().toFile('public/brand/fiscalwatch-logo-640.png'),
  sharp(logo).resize(1280, 320).png().toFile('public/brand/fiscalwatch-logo-1280.png'),
);

const results = await Promise.all(jobs);
console.log(`rendered ${results.length} brand assets`);
