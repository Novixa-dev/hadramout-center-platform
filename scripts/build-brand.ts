/** Generate PNG icons and the default social card from the official SVG logos. Run once: node scripts/build-brand.ts */
import sharp from 'sharp';
const icon = 'public/brand/logo-icon.svg';
const paper = '#fffbf5';
for (const size of [192, 512]) {
  const inner = Math.round(size * 0.78);
  const mark = await sharp(icon, { density: 400 }).resize({ height: inner, fit: 'inside' }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: paper } }).composite([{ input: mark, gravity: 'center' }]).png().toFile(`public/icons/icon-${size}.png`);
}
// maskable: extra padding
{
  const size = 512;
  const mark = await sharp(icon, { density: 400 }).resize({ height: Math.round(size * 0.6), fit: 'inside' }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: paper } }).composite([{ input: mark, gravity: 'center' }]).png().toFile('public/icons/maskable-512.png');
}
await sharp('public/brand/logo-icon.svg', { density: 300 }).resize({ height: 32 }).png().toFile('public/icons/favicon-32.png');
// social card 1200x630
const logo = await sharp('public/brand/logo.svg', { density: 500 }).resize({ width: 760 }).png().toBuffer();
const mark = await sharp(icon, { density: 400 }).resize({ height: 330 }).png().toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: paper } })
  .composite([{ input: mark, left: 110, top: 150 }, { input: logo, left: 330, top: 250 }])
  .png()
  .toFile('public/brand/og-default.png');
console.log('brand assets written');
