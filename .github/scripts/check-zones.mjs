// Asks e-solat for every zone code listed in the widget and reports any that
// return no timetable. The widget falls back to Aladhan for those zones, so
// visitors get approximate times instead of JAKIM's without any visible error.
import { readFileSync, writeFileSync } from 'node:fs';

const WIDGET = process.env.WIDGET_FILE || 'v2/js/ws.js';
const API = process.env.ESOLAT_API ||
  'https://www.e-solat.gov.my/index.php?r=esolatApi/TakwimSolat&period=month&zone=';
const REPORT = process.env.REPORT_FILE || 'zone-report.md';

const src = readFileSync(WIDGET, 'utf8');
const zones = [...src.matchAll(/code:\s*'([A-Z]{3}\d{2})',\s*name:\s*'([^']*)'/g)]
  .map(m => ({ code: m[1], name: m[2] }));
if (zones.length === 0) {
  console.error(`No zone codes found in ${WIDGET}`);
  process.exit(2);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function check(code) {
  let last = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(API + code, {
        headers: { 'User-Agent': 'waktu-solat-zone-check (+https://github.com/bukitbesi/waktu-solat)' },
        signal: AbortSignal.timeout(20000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.prayerTime) && data.prayerTime.length > 0) return { ok: true };
      // a well-formed reply with no days is e-solat saying it does not know the code
      return { ok: false, reason: 'no timetable returned', reachable: true };
    } catch (e) {
      last = e.message;
      await sleep(2000 * attempt);
    }
  }
  return { ok: false, reason: last, reachable: false };
}

const failed = [];
for (const z of zones) {
  const r = await check(z.code);
  console.log(`${z.code} ${r.ok ? 'ok' : 'FAIL: ' + r.reason}`);
  if (!r.ok) failed.push({ ...z, ...r });
  await sleep(500);
}

if (failed.length === 0) {
  console.log(`All ${zones.length} zones returned a JAKIM timetable.`);
  process.exit(0);
}

// every request failing at the network level means e-solat is down or blocking
// the runner, which says nothing about the zone codes themselves
const outage = failed.length === zones.length && failed.every(f => !f.reachable);
const lines = outage
  ? [`e-solat could not be reached for any of the ${zones.length} zones (${failed[0].reason}).`,
     '', 'This is an outage or a block on GitHub\'s servers, not a zone code problem. ' +
     'If it keeps happening, check https://www.e-solat.gov.my in a browser.']
  : [`${failed.length} of ${zones.length} zone codes in \`${WIDGET}\` got no JAKIM timetable, ` +
     'so visitors in these zones are shown Aladhan (MWL) times instead:', '',
     '| Code | Zone | Problem |', '|---|---|---|',
     ...failed.map(f => `| ${f.code} | ${f.name} | ${f.reason} |`), '',
     'Compare against the zone list on https://www.e-solat.gov.my and update the codes. ' +
     'If a code changed, add the old one to the migration in `loadSavedZone()` so saved visitors move too.'];
writeFileSync(REPORT, lines.join('\n') + '\n');
console.log('\n' + lines.join('\n'));
process.exit(outage ? 3 : 1);
