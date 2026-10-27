// Tests v20.6 — het avondslot uit de database (CEO-GO 27-10-2026). Draaien: node test_avslot_v20_6.js <bestand.html>
// Voorbeeldpositie PUT 5500 × 100, premie 2,00, kas € 400.000: geen echte positie of kas (dit bestand staat in de openbare repo). Vaste klok per test, gestubde fetch per URL. De oefenweek (OESX_TEST_POS) + testhaak OESX_TEST_AVSLOT=true.
const fs=require('fs'),{JSDOM}=require('jsdom');
const BESTAND=process.argv[2]||'eurostoxx50_dashboard_v20_6.html';
const HTML=fs.readFileSync(BESTAND,'utf8');
let ok=0,fout=0;const F=[];
function t(naam,cond,extra){if(cond)ok++;else{fout++;F.push(naam+(extra!==undefined?' → '+JSON.stringify(extra):''))}}
const tik=(ms=0)=>new Promise(r=>setTimeout(r,ms));
const POS={K:5500,n:100,premie:2.0,instap:6047,slot:6068.22,vslot:21.9152,kasApp:400000,datum:new Date(2026,9,23),v1625:22.957,kasDatum:'2026-10-23'};
// rijen zoals de database ze teruggeeft (opgeslagen_op in UTC: 17:30Z = 18:30 Amsterdam)
const RIJ_I={datum:'2026-10-27',index_slot:6164.69,bron:'Börse Frankfurt, opgehaald 2026-10-27 18:30',opgeslagen_op:'2026-10-27T17:30:04.258+00:00'};
const RIJ_V={datum:'2026-10-27',vstoxx_slot:20.4253,bron:'Börse Frankfurt (voorlopig), opgehaald 2026-10-27 18:30',opgeslagen_op:'2026-10-27T17:30:04.015+00:00'};
async function open(opts){
 const o=Object.assign({klok:new Date(2026,9,27,20,41),idx:[RIJ_I],vx:[RIJ_V],haak:true,fetchFout:false,geheugen:null},opts||{});
 const log=[];const st={nu:o.klok.getTime()};
 const dom=new JSDOM(HTML,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://sven50xx.github.io/eurostoxx-dasboard/x.html',
  beforeParse(w){
   const RD=w.Date;
   class FD extends RD{constructor(...a){if(a.length===0)super(st.nu);else super(...a)}static now(){return st.nu}}
   w.Date=FD;
   w.OESX_TEST_START='0210';w.OESX_TEST_POS=Object.assign({},POS,{datum:new FD(2026,9,23)});
   if(o.haak)w.OESX_TEST_AVSLOT=true;w.OESX_TEST_TIMEOUT=500;
   if(o.geheugen)w.localStorage.setItem('oesx_s33_avond',JSON.stringify(o.geheugen));
   w.scrollTo=()=>{};
   w.fetch=async(url,init)=>{log.push(String(url));
    const u=String(url);const json=(x,s=200)=>({ok:s<300,status:s,text:async()=>JSON.stringify(x)});
    if(u.includes('index_dagkoersen')){if(o.fetchFout)return json({message:'stuk'},500);return json(typeof o.idx==='function'?o.idx():o.idx)}
    if(u.includes('vstoxx_dagkoersen')&&u.includes('datum=eq.')){if(o.fetchFout)return json({message:'stuk'},500);return json(typeof o.vx==='function'?o.vx():o.vx)}
    return json([]);
   };
  }});
 const w=dom.window;await tik(30);
 return{w,$:id=>w.document.getElementById(id),log,st,zet(d){st.nu=d.getTime()},dom};
}
const hulpTxt=(v,id)=>v.$(id+'-h').textContent;
(async()=>{
 // ---------- T1: avond, beide rijen → ingevuld met bron ----------
 {const v=await open();
  t('T1 index ingevuld',v.$('idx').value==='6.164,69',v.$('idx').value);
  t('T1 VSTOXX ingevuld exact',v.$('vx').value==='20,4253',v.$('vx').value);
  t('T1 bron index',hulpTxt(v,'idx')==='slot di 27-10 · Börse Frankfurt',hulpTxt(v,'idx'));
  t('T1 bron VSTOXX + link',hulpTxt(v,'vx').startsWith('slot di 27-10 · Börse Frankfurt (voorlopig) · VSTOXX op stoxx.com'),hulpTxt(v,'vx'));
  t('T1 link blijft een link',!!v.$('vx-h').querySelector('a[href="https://stoxx.com/index/v2tx/"]'));
  t('T1 zin',v.$('zin').textContent==='Niets doen. Geen signaal.',v.$('zin').textContent);
  t('T1 marge 69,1% bij de voorbeeldpositie',v.$('laag3').textContent.includes('ja, ≈ 69,1%'),v.$('laag3').textContent.slice(0,400));
  const g=JSON.parse(v.w.localStorage.getItem('oesx_s33_avond')||'{}');
  t('T1 avondmeting onthouden',g['2026-10-27']&&g['2026-10-27'].signaal===false&&g['2026-10-27'].slot===6164.69,g);
  t('T1 query alleen vandaag',v.log.some(u=>u.includes('index_dagkoersen?select=datum,index_slot,bron,opgeslagen_op&datum=eq.2026-10-27')),v.log);
  t('T1 geen "straks vanzelf van Yahoo" op Deze week',!v.$('laag2').textContent.includes('straks vanzelf'));
  t('T1 geen Yahoo-zin in Wat nu',!v.$('laag4').textContent.includes('In het echte dashboard'));
  // T2: zelf typen wint, ook na een nieuwe teken-ronde (zoals de minuutklok)
  v.$('idx').value='6100';v.$('idx').dispatchEvent(new v.w.Event('input'));
  v.st.nu+=120000;v.w.teken();await tik(20);
  t('T2 eigen invoer blijft',v.$('idx').value==='6100',v.$('idx').value);
  t('T2 label jouw invoer',/^ingevuld \d\d:\d\d · jouw invoer$/.test(hulpTxt(v,'idx')),hulpTxt(v,'idx'));
  t('T2 VSTOXX blijft van de database',hulpTxt(v,'vx').startsWith('slot di 27-10'),hulpTxt(v,'vx'));
  // T3: leegmaken blijft leeg
  v.$('vx').value='';v.$('vx').dispatchEvent(new v.w.Event('input'));
  v.st.nu+=120000;v.w.teken();await tik(20);
  t('T3 leeg blijft leeg',v.$('vx').value==='',v.$('vx').value);
  t('T3 reden',hulpTxt(v,'vx').startsWith('je maakte het veld leeg · typ het slot'),hulpTxt(v,'vx'));
  v.w.close()}
 // ---------- T4/T5: geen rij ----------
 {const v=await open({klok:new Date(2026,9,27,17,50),idx:[],vx:[]});
  t('T4 leeg voor 18:30',v.$('idx').value===''&&v.$('vx').value==='');
  t('T4 reden 18:30',hulpTxt(v,'idx')==='het slot staat er rond 18:30 · of typ het zelf',hulpTxt(v,'idx'));
  t('T4 zin',v.$('zin').textContent==='Vul het slot van vandaag in.',v.$('zin').textContent);
  t('T4 waarom: nieuwe zin, geen Yahoo-belofte',v.$('waarom').textContent==='De index na 17:30. Rond 18:30 vult het dashboard het slot zelf in uit de database; je mag het ook zelf typen.',v.$('waarom').textContent);
  v.w.close()}
 {const v=await open({klok:new Date(2026,9,27,19,0),idx:[],vx:[]});
  t('T5 reden na 18:30',hulpTxt(v,'idx')==='slot van vandaag staat nog niet in de database · typ het zelf',hulpTxt(v,'idx'));
  t('T5 VSTOXX reden',hulpTxt(v,'vx').startsWith('slot van vandaag staat nog niet in de database'),hulpTxt(v,'vx'));
  v.w.close()}
 // ---------- T6: rij opgeslagen vóór het slot (zoals #102) ----------
 {const v=await open({idx:[Object.assign({},RIJ_I,{opgeslagen_op:'2026-10-27T15:15:00+00:00'})]});
  t('T6 vroege rij niet gebruikt',v.$('idx').value==='',v.$('idx').value);
  t('T6 reden',hulpTxt(v,'idx')==='database heeft nog geen slot van na 17:30 · typ het zelf',hulpTxt(v,'idx'));
  t('T6 VSTOXX wel',v.$('vx').value==='20,4253');
  v.w.close()}
 // ---------- T6b: lege of nul-waarde in de rij ----------
 {const v=await open({idx:[Object.assign({},RIJ_I,{index_slot:null})],vx:[Object.assign({},RIJ_V,{vstoxx_slot:0})]});
  t('T6b leeg/nul niet ingevuld',v.$('idx').value===''&&v.$('vx').value==='',[v.$('idx').value,v.$('vx').value]);
  v.w.close()}
 // ---------- T7: alleen gisteren → niets ----------
 {const v=await open({idx:[Object.assign({},RIJ_I,{datum:'2026-10-26',index_slot:6116.23})],vx:[Object.assign({},RIJ_V,{datum:'2026-10-26'})]});
  t('T7 nooit het slot van gisteren',v.$('idx').value===''&&v.$('vx').value==='',[v.$('idx').value,v.$('vx').value]);
  v.w.close()}
 // ---------- T8: database stuk ----------
 {const v=await open({fetchFout:true});
  t('T8 leeg',v.$('idx').value==='');
  t('T8 reden',hulpTxt(v,'idx')==='database niet bereikbaar · typ het slot zelf',hulpTxt(v,'idx'));
  v.w.close()}
 // ---------- T9: overdag → geen leesactie, oude tekst ----------
 {const v=await open({klok:new Date(2026,9,27,14,0)});
  t('T9 overdag leeg',v.$('idx').value==='');
  t('T9 overdag Saxo-app',hulpTxt(v,'idx')==='uit de Saxo-app',hulpTxt(v,'idx'));
  t('T9 geen leesactie',!v.log.some(u=>u.includes('datum=eq.')),v.log);
  v.w.close()}
 // ---------- T10: pagina blijft open tot de ochtend ----------
 {const v=await open();
  t('T10 avond ingevuld',v.$('idx').value==='6.164,69');
  v.zet(new Date(2026,9,28,9,5));v.w.teken();await tik(20);
  t('T10 ochtend: slot van gisteren weg uit "Index om 09:05"',v.$('idx').value===''&&v.$('vx').value==='',[v.$('idx').value,v.$('vx').value]);
  t('T10 ochtend label',v.$('idx-l').textContent==='Index om 09:05');
  t('T10 ochtend zin uit het onthouden slot',v.$('zin').textContent==='Niets doen. Vanavond opnieuw meten.',v.$('zin').textContent);
  // en de volgende avond weer vers
  v.zet(new Date(2026,9,28,20,0));v.w.teken();await tik(30);
  t('T10 wo-avond: geen rij van wo → leeg',v.$('idx').value==='',v.$('idx').value);
  v.w.close()}
 // ---------- T11: geoefend moment → niets uit de database ----------
 {const v=await open();
  v.w.kiesMoment(new Date(2026,9,28,18,0));await tik(20);
  t('T11 geoefend: leeg',v.$('idx').value===''&&v.$('vx').value==='');
  t('T11 geoefend: label',hulpTxt(v,'idx')==='geoefend moment: typ het slot',hulpTxt(v,'idx'));
  v.w.kiesMoment(null);await tik(30);
  t('T11 echte klok terug: weer ingevuld',v.$('idx').value==='6.164,69',v.$('idx').value);
  v.w.close()}
 // ---------- T12: oefenweek zonder haak leest niets ----------
 {const v=await open({haak:false});
  t('T12 geen leesactie',!v.log.some(u=>u.includes('datum=eq.')),v.log);
  t('T12 leeg',v.$('idx').value==='');
  t('T12 label',hulpTxt(v,'idx')==='typ het slot',hulpTxt(v,'idx'));
  v.w.close()}
 // ---------- T13: signaal ----------
 {const v=await open({idx:[Object.assign({},RIJ_I,{index_slot:5600})],vx:[Object.assign({},RIJ_V,{vstoxx_slot:26})]});
  t('T13 signaal zin',v.$('zin').textContent==='Morgen om 09:05 de index aflezen.',v.$('zin').textContent);
  const g=JSON.parse(v.w.localStorage.getItem('oesx_s33_avond')||'{}');
  t('T13 signaal onthouden',g['2026-10-27']&&g['2026-10-27'].signaal===true,g);
  v.w.close()}
 // ---------- T13b: precies op de drempel en op de Exit (onafgerond) ----------
 {const v=await open({idx:[Object.assign({},RIJ_I,{index_slot:5500/0.97})],vx:[Object.assign({},RIJ_V,{vstoxx_slot:25.9152})]});
  t('T13b precies op de onafgeronde Exit en de drempel = signaal',v.$('zin').textContent==='Morgen om 09:05 de index aflezen.',[v.$('idx').value,v.$('zin').textContent]);
  v.w.close()}
 {const v=await open({idx:[Object.assign({},RIJ_I,{index_slot:5670.11})],vx:[Object.assign({},RIJ_V,{vstoxx_slot:30})]});
  t('T13c 5.670,11 ligt boven de Exit 5.670,1031 → geen signaal',v.$('zin').textContent==='Niets doen. Geen signaal.',[v.$('idx').value,v.$('zin').textContent]);
  v.w.close()}
 {const v=await open({idx:[Object.assign({},RIJ_I,{index_slot:5670.10})],vx:[Object.assign({},RIJ_V,{vstoxx_slot:25.91515})]});
  t('T13d VSTOXX 25,91515 ligt onder de drempel 25,9152 (niet afronden) → geen signaal',v.$('vx').value==='25,91515'&&v.$('zin').textContent==='Niets doen. Geen signaal.',[v.$('vx').value,v.$('zin').textContent]);
  v.w.close()}
 // ---------- T14: alleen de index ----------
 {const v=await open({vx:[]});
  t('T14 index ingevuld',v.$('idx').value==='6.164,69');
  t('T14 VSTOXX leeg met reden',v.$('vx').value===''&&hulpTxt(v,'vx').startsWith('slot van vandaag staat nog niet'),hulpTxt(v,'vx'));
  t('T14 zin',v.$('zin').textContent==='Niets doen. Geen signaal.');
  v.w.close()}
 // ---------- T14b: index onder de Exit, VSTOXX ontbreekt → vraagt om de VSTOXX ----------
 {const v=await open({idx:[Object.assign({},RIJ_I,{index_slot:5600})],vx:[]});
  t('T14b vraagt VSTOXX',v.$('zin').textContent==='Vul ook het VSTOXX-slot in.',v.$('zin').textContent);
  const g=JSON.parse(v.w.localStorage.getItem('oesx_s33_avond')||'{}');
  t('T14b niets onthouden zonder VSTOXX',!g['2026-10-27'],g);
  v.w.close()}
 // ---------- T15: eerst fout, na een minuut opnieuw ----------
 {let n=0;const v=await open({idx:()=>{n++;return n===1?null:[RIJ_I]}});
  // null-antwoord → geen rij; na < 60 s geen nieuwe poging
  const voor=v.log.filter(u=>u.includes('index_dagkoersen')).length;
  v.st.nu+=30000;v.w.teken();await tik(20);
  t('T15 geen herhaling binnen een minuut',v.log.filter(u=>u.includes('index_dagkoersen')).length===voor);
  v.st.nu+=40000;v.w.teken();await tik(30);
  t('T15 na een minuut opnieuw en ingevuld',v.$('idx').value==='6.164,69',[v.$('idx').value,v.log.length]);
  const na=v.log.filter(u=>u.includes('dagkoersen?select')).length;
  v.st.nu+=120000;v.w.teken();await tik(20);
  t('T15 compleet → geen leesacties meer',v.log.filter(u=>u.includes('dagkoersen?select')).length===na);
  v.w.close()}
 // ---------- T16: de waarde is exact het getal uit de database ----------
 {const v=await open({vx:[Object.assign({},RIJ_V,{vstoxx_slot:25.9151})]});
  t('T16 exact (net onder de drempel)',v.$('vx').value==='25,9151'&&v.$('laag3').textContent.includes('nog 0,0001 pt'),v.$('laag3').textContent.slice(0,300));
  v.w.close()}
 // ---------- T17: bron wordt nooit als HTML gelezen ----------
 {const v=await open({vx:[Object.assign({},RIJ_V,{bron:'<img src=x id=boef>'})]});
  t('T17 geen HTML uit de bron',!v.w.document.getElementById('boef')&&hulpTxt(v,'vx').includes('<img'),hulpTxt(v,'vx'));
  v.w.close()}
 // ---------- T18: donderdagavond (morgen expiratie) ----------
 {const v=await open({klok:new Date(2026,9,29,19,0),idx:[Object.assign({},RIJ_I,{datum:'2026-10-29',opgeslagen_op:'2026-10-29T17:30:00Z'})],vx:[Object.assign({},RIJ_V,{datum:'2026-10-29',opgeslagen_op:'2026-10-29T17:30:00Z'})]});
  t('T18 do-avond ingevuld',v.$('idx').value==='6.164,69');
  t('T18 do-avond tekst expiratie',v.$('laag4').textContent.includes('Morgen is de expiratie'),v.$('laag4').textContent);
  v.w.close()}
 // ---------- T19: vrijdagavond (geen avondmeting) leest niets ----------
 {const v=await open({klok:new Date(2026,9,30,19,0)});
  t('T19 vrijdagavond geen leesactie',!v.log.some(u=>u.includes('datum=eq.')),v.log);
  v.w.close()}
 // ---------- T20: versie ----------
 {t('T20 versie in titel',HTML.includes('<title>OESX · dashboard v20.6'));
  t('T20 geen schermtekst v20.5',!/Dashboard v20\.5|toont v20\.5/.test(HTML));
  t('T20 gedeeld B165-blok ongewijzigd (commentaar)',HTML.includes('// Dit blok staat WOORDELIJK gelijk in rekentool v12.2 en dashboard v20.5; een test vergelijkt beide.'))}
 console.log(ok+'/'+(ok+fout)+' tests geslaagd');
 if(fout){console.log(F.join('\n'));process.exit(1)}
 process.exit(0);
})().catch(e=>{console.log('CRASH',e);process.exit(2)});
