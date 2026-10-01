// pages.e2e.js
// The real pages, in a real browser, against three back-end states: nothing
// saved, the ranks the live back end held on 29 September 2026, and ranks saved
// from the admin page's fill button. Also checks the front page survives the
// chart add-on failing to load, and the one-pager's source line.
//
// Not part of npm test, because it needs Chromium and Playwright, and neither
// belongs in the Netlify build. Run it with npm run e2e. If Playwright is not
// installed, npm install --no-save playwright first.
// In the web container Chromium is at /opt/pw-browsers/chromium. Elsewhere set
// CHROMIUM to the browser's path, or leave it unset to use Playwright's own.
const http=require('http'),fs=require('fs'),path=require('path');
const { chromium } = require('playwright');
const ROOT=path.join(__dirname,'public'), OUT=path.join(__dirname,'docs','shots');
const SAVED=path.join(require('os').tmpdir(),'lukehammond-e2e-saved.json');
fs.mkdirSync(OUT,{recursive:true});
// The site's real content policy, read from netlify.toml, so a page that
// reaches for anything the policy forbids fails here the way it would live.
const CSP=(/Content-Security-Policy = "([^"]+)"/.exec(fs.readFileSync(path.join(__dirname,'netlify.toml'),'utf8'))||[])[1];
const T={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=http.createServer((rq,rs)=>{const u=rq.url.split('?')[0];
const p=path.join(ROOT,decodeURIComponent(u==='/'?'/index.html':u));
if(!p.startsWith(ROOT)||!fs.existsSync(p)||fs.statSync(p).isDirectory()){rs.writeHead(404);return rs.end('x');}
rs.writeHead(200,{'content-type':T[path.extname(p)]||'application/octet-stream', 'content-security-policy': CSP});fs.createReadStream(p).pipe(rs);});

// The ranks the live back end holds today, fetched from the deployed site on 29 Sept.
const LIVE = {"rankings":{"200-free-LCM":{"rank":6,"basis":"Canada, for age"},"400-free-LCM":{"rank":4,"basis":"Canada, for age"},"800-free-LCM":{"rank":4,"basis":"Canada, for age"},"1500-free-LCM":{"rank":5,"basis":"Canada, for age"},"50-free-LCM":{"rank":20,"basis":"Canada, for age"},"100-free-LCM":{"rank":15,"basis":"Canada, for age"},"200-back-LCM":{"rank":9,"basis":"Canada, for age"},"400-im-LCM":{"rank":11,"basis":"Canada, for age"}},"coach":{}};

let fails=0; const ok=(name,cond,extra)=>{ if(!cond) fails++; console.log((cond?'  ok   ':'  FAIL ')+name+(extra!==undefined?'  ['+extra+']':'')); };

async function page(b, url, profile, opts={}) {
  const c=await b.newContext({viewport:opts.vp||{width:1440,height:900},deviceScaleFactor:opts.dsf||1,ignoreHTTPSErrors:true});
  const pg=await c.newPage();
  // Errors from the site's own code fail the run. An error thrown inside a CDN
  // script because the CDN did not deliver its dependency is the network, not
  // the site, and the blocked add-on case below is what tests the site survives it.
  const errors=[]; pg.on('pageerror',e=>{ if (!/cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/.test(e.stack||'')) errors.push(e.message); });
  const puts=[];
  await pg.route('**/api/**', r=>r.fulfill({status:404, body:'{}', contentType:'application/json'}));
  if (opts.blockAdapter) await pg.route('**/chartjs-adapter-date-fns**', r=>r.abort());
  await pg.route('**/api/schools**', r=>r.fulfill({status:200, body:JSON.stringify({schools:[]}), contentType:'application/json'}));
  await pg.route('**/api/photos**', r=>r.fulfill({status:200, body:JSON.stringify({photos:[]}), contentType:'application/json'}));
  await pg.route('**/api/profile**', r=>{
    if (r.request().method()==='PUT') { puts.push(JSON.parse(r.request().postData())); return r.fulfill({status:200,body:'{"ok":true}',contentType:'application/json'}); }
    return r.fulfill({status:200, body:JSON.stringify({profile:profile, seeded:profile===null}), contentType:'application/json'});
  });
  await pg.goto('http://localhost:4176/'+url,{waitUntil:'networkidle'});
  await pg.waitForTimeout(700);
  return {c,pg,errors,puts};
}

(async()=>{
  await new Promise(r=>server.listen(4176,r));
  const exe=process.env.CHROMIUM||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined);
  const b=await chromium.launch(exe?{executablePath:exe}:{});

  // ---------- v2, three states ----------
  for (const [label, profile] of [['nothing saved', null], ['live back end today', LIVE]]) {
    console.log('\nv2.html, ' + label);
    const {c,pg,errors}=await page(b,'v2.html',profile);
    const t=await pg.evaluate(()=>({
      eyebrow: document.getElementById('hero-rank').textContent,
      count: document.getElementById('rank-count').textContent,
      items: [...document.querySelectorAll('#rank-list li')].map(l=>l.textContent),
      src: document.getElementById('rank-src').textContent,
      lede: document.getElementById('board-lede').textContent,
      badges: [...document.querySelectorAll('#board-rows .rk')].map(x=>x.textContent).filter(Boolean),
      text: document.body.innerText
    }));
    ok('no page errors', errors.length===0, errors.join('; '));
    ok('no #2 anywhere on the page', !/#2\b/.test(t.text));
    if (!profile) {
      ok('hero names the group', t.eyebrow==='#4 in Canada, 13-14 boys', t.eyebrow);
      ok('ten ranked swims listed', t.items.length===10, t.items.length);
      ok('first is the 400 free at #4', /^#4400m Freestyle4:10\.86$/.test(t.items[0]), t.items[0]);
      ok('last is the 50 free at #46', /^#4650m Freestyle25\.96$/.test(t.items[9]), t.items[9]);
      ok('the heading says ten events', t.count==='ten events', t.count);
      ok('the source is named', t.src.indexOf('CSCA TAG Rankings, Volume 4, September 2026. Boys 13-14, long course, 1 September 2025 to 31 August 2026')===0, t.src);
      ok('lede counts the badges actually shown', t.lede.indexOf(t.badges.length+' of these carry a national rank')!==-1, t.badges.length);
      await pg.screenshot({path:OUT+'/ranks-v2-desktop.png', fullPage:true});
    } else {
      ok('hero keeps plain wording for hand-typed ranks', t.eyebrow==='#4 in Canada, for his age', t.eyebrow);
      ok('eight ranked swims, as stored', t.items.length===8, t.items.length);
      ok('no borrowed source on unsourced ranks', t.src==='National rankings for his age, as entered.', t.src);
    }
    await c.close();
  }

  // ---------- v2 on a phone ----------
  { const {c,pg}=await page(b,'v2.html',null,{vp:{width:390,height:844},dsf:2});
    const m=await pg.evaluate(()=>({w:document.documentElement.scrollWidth, cols:getComputedStyle(document.getElementById('rank-list')).gridTemplateColumns}));
    ok('\nphone: no horizontal overflow', m.w===390, m.w);
    ok('phone: ranked list is one column', m.cols.split(' ').length===1, m.cols);
    await pg.locator('#ranks').screenshot({path:OUT+'/ranks-v2-phone.png'});
    await c.close(); }

  // ---------- index.html, the live front page ----------
  for (const [label, profile] of [['nothing saved', null], ['live back end today', LIVE]]) {
    console.log('\nindex.html, ' + label);
    const {c,pg,errors}=await page(b,'index.html',profile);
    const t=await pg.evaluate(()=>({
      badge: (document.getElementById('hero-badge-claim')||{}).textContent,
      stats: [...document.querySelectorAll('#hero-stats .hero-stat')].map(x=>x.innerText.replace(/\s+/g,' ')),
      intro: (document.getElementById('times-intro')||{}).innerText,
      foot: (document.getElementById('times-footnote')||{}).textContent,
      text: document.body.innerText
    }));
    ok('no page errors', errors.length===0, errors.join('; '));
    ok('hero badge', t.badge==='Ranked Top 5 in Canada · 3 Distance Free Events', t.badge);
    ok('hero strip is 400, 800, 1500', t.stats.length===3 && /^#4 .*400m/i.test(t.stats[0]) && /^#4 .*800m/i.test(t.stats[1]) && /^#5 .*1500m/i.test(t.stats[2]), t.stats.join(' | '));
    ok('no #2 in Canada anywhere', !/#2 in Canada|#2\s*Canada/.test(t.text));
    if (!profile) {
      ok('rank sentence names the group', t.intro.indexOf('Ranked in Canada, Boys 13-14, long course, 2025-26: #4 400 Free LCM')===0, t.intro.slice(0,90));
      ok('footnote names the list', t.foot.indexOf('Rankings: CSCA TAG Rankings, Volume 4, September 2026, Boys 13-14')!==-1, t.foot);
      ok('all ten appear in the sentence', (t.intro.match(/#\d+/g)||[]).length===10, (t.intro.match(/#\d+/g)||[]).length);
    } else {
      ok('hand-typed ranks keep "for age"', t.intro.indexOf('Ranked in Canada for age: #4')===0, t.intro.slice(0,60));
      ok('and the footnote claims no list', t.foot.indexOf('Canada, for age')!==-1, t.foot);
    }
    await c.close();
  }

  // ---------- index.html when the chart add-on fails to load ----------
  { console.log('\nindex.html, chart date add-on blocked');
    const {c,pg,errors}=await page(b,'index.html',null,{blockAdapter:true});
    const t=await pg.evaluate(()=>({
      intro:(document.getElementById('times-intro')||{}).innerText||'',
      cards:document.querySelectorAll('#times-grid .time-card').length,
      rows:document.querySelectorAll('#comp-table tbody tr').length
    }));
    ok('no uncaught page error', errors.length===0, errors.join('; '));
    ok('rankings still render', (t.intro.match(/#\d+/g)||[]).length===10, (t.intro.match(/#\d+/g)||[]).length);
    ok('time cards still render', t.cards>=10, t.cards);
    ok('results table still renders', t.rows>=10, t.rows);
    await c.close(); }

  // ---------- nothing leaves the site, and nothing is refused ----------
  // Every outside request is cut off. The pages have to draw their charts,
  // fonts and QR from this site alone, under the real content policy.
  for (const pageName of ['index.html', 'v2.html', 'onepager.html', 'admin.html']) {
    const c=await b.newContext({viewport:{width:1280,height:900}}); const pg=await c.newPage();
    const outside=[], refused=[];
    await pg.route(/^https?:\/\/(?!localhost)/, r=>{ outside.push(r.request().url()); return r.abort(); });
    await pg.route('**/api/**', r=>r.fulfill({status:404, body:'{}', contentType:'application/json'}));
    pg.on('console', m=>{ if (/Refused to|Content Security Policy|Failed to find a valid digest/i.test(m.text())) refused.push(m.text()); });
    await pg.goto('http://localhost:4176/'+pageName,{waitUntil:'networkidle'});
    if (pageName==='index.html') {
      await pg.evaluate(()=>document.getElementById('performance').scrollIntoView());
      await pg.waitForTimeout(900);
    } else await pg.waitForTimeout(500);
    const m=await pg.evaluate(()=>({
      chart: typeof window.Chart, adapter: !!(window.Chart && window.Chart._adapters && window.Chart._adapters._date && window.Chart._adapters._date.prototype.formats().datetime),
      drawn: [...document.querySelectorAll('canvas#chart400, canvas#chart800')].map(cv=>{ const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data; let n=0; for(let i=3;i<d.length;i+=4) if(d[i]) n++; return n; }),
      bebas: document.fonts.check('20px "Bebas Neue"'), dm: document.fonts.check('16px "DM Sans"'),
      qr: !!document.querySelector('#qr svg, #qr img, #qr canvas, #qr table') || !!(document.getElementById('qr')||{}).innerHTML
    }));
    console.log('\n' + pageName + ', every outside request cut off, real content policy');
    ok('it tried to reach nothing outside the site', outside.length===0, outside.join(' '));
    ok('and the policy refused nothing', refused.length===0, refused.join(' | '));
    if (pageName==='index.html') {
      ok('Chart.js loaded from this site', m.chart==='function');
      ok('and its date add-on', m.adapter);
      ok('both charts drew', m.drawn.length===2 && m.drawn.every(n=>n>500), m.drawn.join(','));
      ok('the display font loaded', m.bebas);
      ok('and the body font', m.dm);
    }
    if (pageName==='onepager.html') ok('the QR drew from the local library, hash checked', m.qr);
    await c.close();
  }

  // ---------- a tap near a swim on a phone chart ----------
  { const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}); const pg=await c.newPage();
    await pg.route('**/api/**', r=>r.fulfill({status:404, body:'{}', contentType:'application/json'}));
    await pg.goto('http://localhost:4176/index.html',{waitUntil:'networkidle'});
    await pg.evaluate(()=>document.getElementById('chart400').scrollIntoView({block:'center'}));
    await pg.waitForTimeout(900);
    // Find the last swim's dot, then tap 14px to the left of it and 30px
    // above, ie, a near miss that the old setting ignored.
    const target=await pg.evaluate(()=>{
      const cv=document.getElementById('chart400'); const ch=window.Chart.getChart(cv);
      const pts=ch.getDatasetMeta(0).data; const p=pts[pts.length-1]; const r=cv.getBoundingClientRect();
      return { x: r.left + p.x - 14, y: r.top + p.y - 30, n: pts.length };
    });
    await pg.touchscreen.tap(target.x, target.y);
    await pg.waitForTimeout(400);
    const tip=await pg.evaluate(()=>{ const ch=window.Chart.getChart(document.getElementById('chart400'));
      const a=ch.tooltip.getActiveElements(); return a.length ? { ds:a[0].datasetIndex, i:a[0].index, text:(ch.tooltip.body||[]).map(b=>b.lines.join(' ')).join(' ') } : null; });
    console.log('\nindex.html at 390px, a near miss on the 400 free chart');
    ok('a near miss still shows a swim', !!tip && tip.ds===0, JSON.stringify(tip));
    ok('the one nearest where the finger landed', !!tip && tip.i===target.n-1, JSON.stringify(tip));
    await c.close(); }

  // ---------- index.html: charts under their heading, menu fits ----------
  for (const w of [1000, 1440, 390]) {
    const {c,pg}=await page(b,'index.html',null,{vp:{width:w,height:900}});
    const m=await pg.evaluate(()=>{
      const top=n=>n?Math.round(n.getBoundingClientRect().top+scrollY):null;
      const hs=[...document.querySelectorAll('#performance h2')];
      const logo=document.querySelector('.nav-logo').getBoundingClientRect();
      const links=document.querySelector('.nav-links');
      const shown=getComputedStyle(links).display!=='none';
      const last=[...links.querySelectorAll('a')].pop().getBoundingClientRect();
      return { perf:top(hs.find(x=>/performance over time/i.test(x.textContent))),
        chart:top(document.getElementById('chart400')),
        season:top(hs.find(x=>/season by season/i.test(x.textContent))),
        gap: shown ? Math.round(links.getBoundingClientRect().left-logo.right) : null,
        offRight: shown ? Math.round(last.right-innerWidth) : null };
    });
    console.log('\nindex.html at ' + w + 'px');
    ok('charts come straight after their heading', m.perf < m.chart && m.chart < m.season, JSON.stringify(m));
    ok('the menu does not touch the logo', m.gap===null || m.gap >= 40, m.gap);
    ok('the menu stays on screen', m.offRight===null || m.offRight <= 0, m.offRight);
    await c.close();
  }

  // ---------- every rank badge under its time, lined up ----------
  for (const w of [1440, 1000, 390]) {
    const {c,pg}=await page(b,'index.html',null,{vp:{width:w,height:900}});
    const rows=await pg.evaluate(()=>[...document.querySelectorAll('#times-grid .time-card-front')].map(f=>{
      const v=f.querySelector('.time-value'), bdg=f.querySelector('.time-pb-badge');
      const r=document.createRange(); r.selectNodeContents(v.firstChild); const t=r.getBoundingClientRect();
      const bb=bdg?bdg.getBoundingClientRect():null;
      return {time:v.firstChild.textContent, below:bb?Math.round(bb.top-t.bottom):null, left:bb?Math.round(bb.left-t.left):null};
    }));
    console.log('\nindex.html at ' + w + 'px, rank badges');
    ok('every ranked card has its badge under the time', rows.length>=10 && rows.every(r=>r.below!==null && r.below>=0), JSON.stringify(rows.filter(r=>r.below===null||r.below<0)));
    ok('and lined up with it', rows.every(r=>Math.abs(r.left)<=2), JSON.stringify(rows.filter(r=>Math.abs(r.left)>2)));
    ok('with the same gap on every card', new Set(rows.map(r=>r.below)).size===1, [...new Set(rows.map(r=>r.below))].join(','));
    await c.close();
  }

  // ---------- the front page never scrolls sideways on a phone ----------
  // The results table was 20px wider than a 390px phone. Found 1 October 2026.
  for (const w of [320, 360, 390, 414]) {
    const {c,pg}=await page(b,'index.html',null,{vp:{width:w,height:800}});
    const sw=await pg.evaluate(()=>document.documentElement.scrollWidth);
    console.log('\nindex.html at ' + w + 'px');
    ok('no sideways scroll', sw<=w, sw);
    await c.close();
  }

  // ---------- the short course table on a phone ----------
  { const {c,pg}=await page(b,'index.html',null,{vp:{width:390,height:844}});
    const m=await pg.evaluate(()=>{ const t=document.getElementById('scm-table');
      const rows=[...t.querySelectorAll('tbody tr')];
      const firstVisible=rows.every(r=>getComputedStyle(r.cells[0]).display!=='none' && r.cells[0].getBoundingClientRect().width>40);
      return { rows: rows.length, firstVisible, ranked: rows.filter(r=>/#\d+/.test(r.cells[2].textContent)).length,
        eight: rows.map(r=>r.cells[0].textContent+' '+r.cells[1].textContent+' '+r.cells[2].textContent).filter(x=>/800m Freestyle/.test(x))[0] }; });
    console.log('\nindex.html at 390px, short course table');
    ok('ten events listed', m.rows===10, m.rows);
    ok('the event name shows on every row', m.firstVisible);
    ok('seven carry a short course rank', m.ranked===7, m.ranked);
    ok('the 800 reads 8:30.34 at #3', /8:30\.34 #3/.test(m.eight||''), m.eight);
    await c.close(); }

  // ---------- a coach can reach Luke ----------
  // The email link did nothing from 19 September to 1 October 2026.
  for (const w of [1280, 390]) {
    const {c,pg}=await page(b,'index.html',null,{vp:{width:w,height:900}});
    const opened=[]; pg.on('request', r=>{ if (/^mailto:/.test(r.url())) opened.push(r.url()); });
    await pg.click('.hero-contact'); await pg.waitForTimeout(900);
    const atContact=await pg.evaluate(()=>{ const r=document.getElementById('contact-email').getBoundingClientRect(); return r.top>=0 && r.bottom<=innerHeight; });
    await pg.click('#contact-email'); await pg.waitForTimeout(400);
    const a=await pg.evaluate(()=>{ const e=document.getElementById('contact-email'); return { text:e.textContent, href:e.getAttribute('href') }; });
    console.log('\nindex.html at ' + w + 'px, contacting Luke');
    ok('the top link takes a coach to the contact', atContact);
    ok('tapping the email shows the address', a.text==='hammondluke11@icloud.com', a.text);
    ok('and it stays shown', a.text==='hammondluke11@icloud.com');
    ok('and opens an email to Luke with Andrew copied', a.href==='mailto:hammondluke11@icloud.com?cc=andrewhammond75@mac.com', a.href);
    ok('and the email app was actually asked to open', opened.some(u=>/^mailto:hammondluke11@icloud\.com/.test(u)), opened.join(' '));
    ok('once, not twice', opened.length===1, opened.length);
    await c.close();
  }

  // ---------- index.html with scripts off: the static copy ----------
  { const c=await b.newContext({javaScriptEnabled:false}); const pg=await c.newPage();
    await pg.goto('http://localhost:4176/index.html',{waitUntil:'load'});
    const txt=await pg.evaluate(()=>document.body.innerText);
    console.log('\nindex.html, scripts off');
    ok('static strip reads #4, #4, #5', /#4\s+Ranked in Canada · 400m Free · 4:10\.86[\s\S]*#4\s+Ranked in Canada · 800m Free[\s\S]*#5\s+Ranked in Canada · 1500m Free/i.test(txt));
    ok('no #2 in the static copy', !/#2 in Canada/.test(txt));
    await c.close(); }

  // ---------- admin: fill, then save ----------
  { console.log('\nadmin.html, fill from the published list then save, starting from the live back end');
    const {c,pg,errors,puts}=await page(b,'admin.html',LIVE);
    await pg.fill('#key','test'); await pg.click('#unlock'); await pg.waitForTimeout(900);
    const before=await pg.$$eval('#rankRows input[data-rank]', xs=>xs.filter(x=>x.value).map(x=>x.dataset.rank+'='+x.value));
    ok('admin opens with the stored eight', before.length===8, before.length);
    ok('the published list is described', /Published list on file: CSCA TAG Rankings, Volume 4, September 2026, Boys 13-14, long course, 2025-26\. 10 events\./.test(await pg.textContent('#rankPublished')));
    await pg.click('#fillRanks'); await pg.waitForTimeout(200);
    const after=await pg.$$eval('#rankRows input[data-rank]', xs=>Object.fromEntries(xs.filter(x=>x.value).map(x=>[x.dataset.rank,x.value])));
    ok('fill puts all ten in the boxes', Object.keys(after).length===10, Object.keys(after).length);
    ok('50 free now reads 46', after['50-free-LCM']==='46', after['50-free-LCM']);
    ok('nothing saved by filling', puts.length===0);
    // A hand edit after filling: clear the 50 free, type a different 100 back.
    await pg.fill('#rankRows input[data-rank="50-free-LCM"]','');
    await pg.fill('#rankRows input[data-rank="100-back-LCM"]','30');
    await pg.click('#saveRanks'); await pg.waitForTimeout(400);
    ok('one save went out', puts.length===1, puts.length);
    const saved = puts[0] && puts[0].profile.rankings;
    ok('cleared box stays cleared', saved && !saved['50-free-LCM']);
    ok('the list rank keeps its source', saved && saved['400-free-LCM'].source==='CSCA TAG Rankings, Volume 4, September 2026' && saved['400-free-LCM'].rank===4);
    ok('and its group', saved && saved['400-free-LCM'].basis==='Boys 13-14, long course, 2025-26');
    ok('a hand-typed rank does not borrow the source', saved && saved['100-back-LCM'].rank===30 && !saved['100-back-LCM'].source && saved['100-back-LCM'].basis==='Canada, for age');
    ok('coach details were not dropped', puts[0] && typeof puts[0].profile.coach==='object');
    ok('no page errors', errors.length===0, errors.join('; '));
    fs.writeFileSync(SAVED, JSON.stringify(puts[0].profile));
    await c.close(); }

  // ---------- what the public page shows after that save ----------
  { const saved=JSON.parse(fs.readFileSync(SAVED));
    console.log('\nv2.html after that save (one hand-typed rank in the mix)');
    const {c,pg}=await page(b,'v2.html',saved);
    const src=await pg.textContent('#rank-src');
    ok('mixed sources means no single source is claimed', src==='National rankings for his age, as entered.', src);
    await c.close(); }

  // ---------- one-pager ----------
  { console.log('\nonepager.html, nothing saved');
    const {c,pg,errors}=await page(b,'onepager.html',null);
    const t=await pg.evaluate(()=>({note:(document.querySelector('.rank-note')||{}).textContent, text:document.body.innerText}));
    ok('rank note names the list', t.note==='Ranks: CSCA TAG Rankings, Volume 4, September 2026. Boys 13-14, long course, 1 September 2025 to 31 August 2026.', t.note);
    ok('no em or en dash on the sheet', !/[–—]/.test(t.text));
    ok('ten ranks printed', (t.text.match(/#\d+ Canada/g)||[]).length===10, (t.text.match(/#\d+ Canada/g)||[]).length);
    ok('no page errors', errors.length===0, errors.join('; '));
    await c.close(); }

  await b.close(); server.close();
  console.log('\n' + (fails ? fails + ' FAILED' : 'all passed'));
  process.exit(fails?1:0);
})();
