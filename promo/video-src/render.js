const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { spawn } = require('child_process');
const [mode, out, ...rest] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.error('PAGEERR', e.message)); p.on('console', m => console.log('console', m.text()));
  await p.goto('http://127.0.0.1:8123/index.html'); await p.evaluate(() => window.ready);
  const el = await p.$('canvas');
  if (mode === 'stills') {
    for (const t of rest) { await p.evaluate(t => render(+t), t); await el.screenshot({ path: `${out}/f_${t}.png` }); }
  } else {
    const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '30', '-frames:v', '900', '-an', '-movflags', '+faststart', out], { stdio: ['pipe', 'ignore', 'inherit'] });
    for (let f = 0; f < 900; f++) {
      await p.evaluate(t => render(t), f / 30);
      const buf = await el.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (f === 899) await el.screenshot({ path: rest[0] });
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await b.close();
})();
