# Mutanten v20.6 (avondslot uit de database). Elke mutant moet door test_avslot_v20_6.js gebeten worden. Herstelt altijd.
# Draaien: python mutanten_v20_6.py [pad/naar/eurostoxx50_dashboard_v20_6.html]   (test_avslot_v20_6.js staat naast dit script)
# Geen 'timeout'-commando (op Windows is dat iets anders): de tijdslimiet zit in subprocess.
import subprocess,shutil,hashlib,sys,os
HIER=os.path.dirname(os.path.abspath(__file__))
P=os.path.abspath(sys.argv[1]) if len(sys.argv)>1 else os.path.join(HIER,'eurostoxx50_dashboard_v20_6.html')
B=os.path.join(HIER,'backup_v20_6.html');T=os.path.join(HIER,'test_avslot_v20_6.js')
def toets():
 try:return subprocess.run(['node',T,P],capture_output=True,text=True,timeout=150).returncode
 except subprocess.TimeoutExpired:return 'timeout'
assert toets()==0,'origineel faalt'
shutil.copy(P,B);md5=hashlib.md5(open(B,'rb').read()).hexdigest()
M=[
 ('vroege rij (vóór 17:35) toch gebruiken',"if(!avNaSlot(r,dag))return{w:null,reden:'vroeg'};",""),
 ('rij van een andere dag gebruiken',"rijen.find(x=>x&&x.datum===dag)","rijen.find(x=>x)"),
 ('ook op een geoefend moment lezen',"const avAan=()=>simDatum==null&&","const avAan=()=>true&&"),
 ('oefenweek leest altijd',"(!TESTWEEK||window.OESX_TEST_AVSLOT===true)","true"),
 ('eigen invoer overschrijven',"avHand[id]!==dag&&$(id).value.trim()===''","$(id).value!=='x'"),
 ('leegmaken niet onthouden',"avHand[id]=sleutel(nu());delete avAuto[id];","delete avAuto[id];"),
 ('slot blijft staan in de ochtend',"if(avAuto[id]&&(!avond||avAuto[id]!==dag)){$(id).value='';","if(false){$(id).value='';"),
 ('ook overdag invullen',"avond=mom==='avond'&&avAan()","avond=mom!=='weekend'&&avAan()"),
 ('ingevuld slot niet onthouden voor 09:05',"if(nieuw&&r.bewaar)bewaar(sleutel(d),r.bewaar);",""),
 ('waarde afronden op 2 decimalen',"{maximumFractionDigits:10}","{maximumFractionDigits:2}"),
 ('bron als HTML',"(basis?esc(basis)+' · ':'')","(basis?basis+' · ':'')"),
 ('geen herhaling na een lege rij',"if(s&&Date.now()-s.t<60000)return;","if(s)return;"),
 ('herhalen ook als compleet',"if(s&&s.status==='ok'&&s.idx.w!=null&&s.vx.w!=null)return;",""),
 ('reden 18:30 omgedraaid',"return m<1110?","return m>=1110?"),
 ('fout niet gemeld',"if(s.status==='fout')return 'database niet bereikbaar · typ het slot zelf';",""),
 ('bron-label weg',"return 'slot '+datum(d)+' · '+r.bron;","return 'slot '+datum(d);"),
 ('oude Yahoo-zin terug',"Rond 18:30 vult het dashboard het slot zelf in uit de database; je mag het ook zelf typen.","In het echte dashboard komt dit straks vanzelf van Yahoo."),
 ('VSTOXX uit de indextabel',"q('vstoxx_dagkoersen','vstoxx_slot')","q('index_dagkoersen','index_slot')"),
 ('nul of leeg als slot accepteren',"if(r[kol]==null||!isFinite(w)||w<=0)return{w:null,reden:'leeg'};",""),
 ('niet opnieuw tekenen na het lezen',".then(()=>{if(POS)teken()});",".then(()=>{});"),
]
gebeten=0;ontsnapt=[]
try:
 for naam,o,n in M:
  s=open(B,encoding='utf-8').read();assert s.count(o)==1,naam
  open(P,'w',encoding='utf-8',newline='').write(s.replace(o,n))
  if toets()!=0:gebeten+=1
  else:ontsnapt.append(naam)
finally:
 shutil.copy(B,P)
assert hashlib.md5(open(P,'rb').read()).hexdigest()==md5
print(f'{gebeten}/{len(M)} mutanten gebeten');print('ontsnapt:',ontsnapt)
