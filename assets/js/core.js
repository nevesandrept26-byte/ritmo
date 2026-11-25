/** RITMO · Núcleo, armazenamento, migração e utilitários partilhados. */
'use strict';
const STORAGE_KEY='ritmo_personal_dashboard_v2';
const GROUPS=['Peito','Costas','Pernas','Braços','Peito e Costas','Ombros','Abdominais','Full body','Outro'];
const VERSES=[['“Confia no Senhor de todo o teu coração.”','Provérbios 3:5'],['“O Senhor é a minha força e o meu escudo.”','Salmos 28:7'],['“Tudo posso naquele que me fortalece.”','Filipenses 4:13'],['“O Senhor é bom, uma fortaleza no dia da angústia.”','Naum 1:7'],['“Aquietai-vos e sabei que eu sou Deus.”','Salmos 46:10'],['“Buscai primeiro o Reino de Deus.”','Mateus 6:33'],['“Sede fortes e corajosos. Não temais.”','Deuteronómio 31:6'],['“O amor é paciente, o amor é bondoso.”','1 Coríntios 13:4'],['“Entrega o teu caminho ao Senhor; confia nele.”','Salmos 37:5']];
const READING_PLAN=['Marcos 1:1-20','Marcos 1:21-45','Marcos 2:1-17','Marcos 2:18-28','Marcos 3:1-19','Marcos 3:20-35','Marcos 4:1-20','Marcos 4:21-41','Marcos 5:1-20','Marcos 5:21-43','Marcos 6:1-29','Marcos 6:30-56','Marcos 7:1-23','Marcos 7:24-37','Marcos 8:1-21','Marcos 8:22-38','Marcos 9:1-29','Marcos 9:30-50','Marcos 10:1-31','Marcos 10:32-52','Marcos 11:1-25','Marcos 11:27–12:17','Marcos 12:18-44','Marcos 13:1-23','Marcos 13:24-37','Marcos 14:1-31','Marcos 14:32-72','Marcos 15:1-32','Marcos 15:33-47','Marcos 16:1-20'];
const EMPTY={workouts:[],bible:[],prayers:[],faithDays:{},requests:[],favorites:[],readingPlan:{completed:{}},bibleReader:{completed:{},favorites:[],lastBook:'gn',lastChapter:1},exerciseRankThresholds:{},discipline:{},habits:[],habitChecks:{},nutrition:{},weights:[],measurements:[],sleep:[],recoveryDays:{},planner:{},gymTemplates:[],savedFoods:[],mealPresets:[],journal:[],goals:[],weeklyReflection:{text:'',improve:''},recipes:[],mealPlans:{},bibleJourney:null,assistant:{messages:[]},meta:{},gamification:{xp:0,events:{},areaXp:{faith:0,fitness:0,nutrition:0,discipline:0}},settings:{calories:0,protein:0,carbs:0,fat:0,water:0,theme:'dark',dashboardWidgets:{hero:true,stats:true,focus:true,daily:true,weekly:true,verse:true,goal:true},reminders:{enabled:false,prayer:'08:00',gym:'17:00',nutrition:'13:00',sleep:'22:00'}}};
function deepMerge(base,src){if(!src||typeof src!=='object')return base;for(const k of Object.keys(src)){if(src[k]&&typeof src[k]==='object'&&!Array.isArray(src[k])&&base[k]&&typeof base[k]==='object'&&!Array.isArray(base[k]))base[k]=deepMerge(base[k],src[k]);else base[k]=src[k]}return base}
function loadData(){
  // Ordem de recuperação: dados principais → recuperação de gravação → backup diário → migração antiga.
  try{const saved=localStorage.getItem(STORAGE_KEY);if(saved){const parsed=JSON.parse(saved);if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))return deepMerge(structuredClone(EMPTY),parsed)}}catch(e){}
  for(const key of [STORAGE_KEY+'_recovery',STORAGE_KEY+'_daily_backup']){
    try{const raw=localStorage.getItem(key);if(raw){const parsed=JSON.parse(raw);if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)){const restored=deepMerge(structuredClone(EMPTY),parsed);try{localStorage.setItem(STORAGE_KEY,JSON.stringify(restored))}catch{}return restored}}}catch(e){}
  }
  try{
    const legacy=localStorage.getItem('myProgressApp_v1');
    if(legacy){const old=JSON.parse(legacy),m=structuredClone(EMPTY);m.workouts=(old.workouts||[]).map(x=>({id:x.id||id(),date:x.date,type:'Musculação',groups:x.muscles||[],duration:x.duration||0,energy:'Normal',didCardio:!!x.cardio,cardioKind:x.cardioType||'',cardioMins:x.cardioDuration||0,exercises:[],notes:x.notes||''}));m.bible=(old.bible||[]).map(x=>({id:x.id||id(),date:x.date,ref:x.ref||'',reflection:x.notes||'',apply:x.action||''}));m.prayers=(old.prayers||[]).map(x=>({id:x.id||id(),date:x.date,type:'Oração',text:x.text||''}));m.requests=(old.requests||[]).map(x=>({id:x.id||id(),text:x.text||'',answered:!!x.done,created:today()}));m.discipline=Object.fromEntries(Object.entries(old.discipline||{}).map(([k,v])=>[k,{clean:!!v.clean,reflection:v.note||' '} ]));m.habits=(old.habits||[]).map(x=>({id:String(x.id||id()),name:x.name||'',category:'Pessoal',target:'daily'}));m.habitChecks=old.habitChecks||{};m.journal=(old.journal||[]).map(x=>({id:x.id||id(),date:x.date,mood:x.mood||'Bem',win:'',text:x.text||''}));m.goals=(old.goals||[]).map(x=>({id:x.id||id(),title:x.text||'',area:'Pessoal',deadline:x.date||'',done:!!x.done,created:today()}));localStorage.setItem(STORAGE_KEY,JSON.stringify(m));return m}
  }catch(e){}
  return structuredClone(EMPTY)
}
let data=loadData(),selectedGroups=[],calendarDate=new Date(),verseIndex=Math.floor(Date.now()/86400000)%VERSES.length,pendingXP=0;
function normalizeData(){
  if(!data||typeof data!=='object'||Array.isArray(data))data=structuredClone(EMPTY);
  ['workouts','bible','prayers','requests','favorites','habits','weights','measurements','sleep','gymTemplates','savedFoods','mealPresets','journal','goals','recipes'].forEach(k=>{if(!Array.isArray(data[k]))data[k]=[]});
  ['discipline','faithDays','habitChecks','nutrition','recoveryDays','planner','mealPlans','exerciseRankThresholds','meta'].forEach(k=>{if(!data[k]||typeof data[k]!=='object'||Array.isArray(data[k]))data[k]={}});
  if(!data.gamification||typeof data.gamification!=='object'||Array.isArray(data.gamification))data.gamification={xp:0,events:{},areaXp:{}};
  if(!data.gamification.events||typeof data.gamification.events!=='object'||Array.isArray(data.gamification.events))data.gamification.events={};
  if(!data.gamification.areaXp||typeof data.gamification.areaXp!=='object'||Array.isArray(data.gamification.areaXp))data.gamification.areaXp={faith:0,fitness:0,nutrition:0,discipline:0};
  data.gamification.xp=Number(data.gamification.xp)||0;
  if(!data.settings||typeof data.settings!=='object'||Array.isArray(data.settings))data.settings={};
  data.settings={...EMPTY.settings,...data.settings};
  if(!data.assistant||typeof data.assistant!=='object'||Array.isArray(data.assistant))data.assistant={messages:[]};
  data.assistant.messages=Array.isArray(data.assistant.messages)?data.assistant.messages.filter(m=>m&&typeof m==='object').slice(-30):[];
  if(!data.bibleReader||typeof data.bibleReader!=='object'||Array.isArray(data.bibleReader))data.bibleReader={completed:{},favorites:[],lastBook:'gn',lastChapter:1};
  data.bibleReader.completed=data.bibleReader.completed&&typeof data.bibleReader.completed==='object'?data.bibleReader.completed:{};
  data.bibleReader.favorites=Array.isArray(data.bibleReader.favorites)?data.bibleReader.favorites:[];
  data.settings.theme=['dark','light','contrast'].includes(data.settings.theme)?data.settings.theme:'dark';
  data.settings.dashboardWidgets={...EMPTY.settings.dashboardWidgets,...(data.settings.dashboardWidgets&&typeof data.settings.dashboardWidgets==='object'?data.settings.dashboardWidgets:{})};
  data.settings.reminders={...EMPTY.settings.reminders,...(data.settings.reminders&&typeof data.settings.reminders==='object'?data.settings.reminders:{})};
  (data.workouts||[]).forEach(w=>{if(!w||typeof w!=='object')return;w.exercises=Array.isArray(w.exercises)?w.exercises:[];w.exercises.forEach(ex=>{if(!ex||typeof ex!=='object')return;if(!Array.isArray(ex.sets)){const count=Math.max(1,Math.min(12,Number(ex.sets)||1)),reps=parseInt(String(ex.reps||'').split('-')[0],10)||0,weight=Number(ex.weight)||0;ex.sets=Array.from({length:count},()=>({weight,reps,rpe:'',warmup:false,completed:true}));}ex.muscle=ex.muscle||'';ex.equipment=ex.equipment||'';});});
  Object.values(data.nutrition).forEach(day=>{if(!day||typeof day!=='object')return;day.meals=Array.isArray(day.meals)?day.meals:[];day.waterMl=Number(day.waterMl)||0;day.meals=day.meals.filter(m=>m&&typeof m==='object');day.meals.forEach(m=>{m.category=m.category||'Outros';m.grams=Number(m.grams)||100;m.calories=Number(m.calories)||0;m.protein=Number(m.protein)||0;m.carbs=Number(m.carbs)||0;m.fat=Number(m.fat)||0;m.fiber=Number(m.fiber)||0;m.source=m.source||'Registo anterior';});});
}
normalizeData();
const RECOVERY_STORAGE_KEY=STORAGE_KEY+'_recovery';
const DAILY_BACKUP_STORAGE_KEY=STORAGE_KEY+'_daily_backup';
const DAILY_BACKUP_META_KEY=STORAGE_KEY+'_daily_backup_meta';
function persist(){
  try{
    const raw=JSON.stringify(data);
    const previous=localStorage.getItem(STORAGE_KEY);
    if(previous&&previous!==raw&&previous.length<=350000){try{localStorage.setItem(RECOVERY_STORAGE_KEY,previous)}catch{}}
    try{localStorage.setItem(STORAGE_KEY,raw)}catch(firstError){
      // Preserva a gravação atual antes de sacrificar uma cópia antiga, se o espaço estiver esgotado.
      try{localStorage.removeItem(RECOVERY_STORAGE_KEY);localStorage.setItem(STORAGE_KEY,raw)}catch(secondError){
        try{localStorage.removeItem(DAILY_BACKUP_STORAGE_KEY);localStorage.removeItem(DAILY_BACKUP_META_KEY);localStorage.setItem(STORAGE_KEY,raw)}catch{throw firstError}
      }
    }
    const savedAt=new Date().toISOString(),meta={savedAt,bytes:new Blob([raw]).size,version:'4.0'};
    try{localStorage.setItem(STORAGE_KEY+'_meta',JSON.stringify(meta))}catch{}
    // Um snapshot por dia, guardado no próprio localStorage. O limite evita consumir todo o espaço do navegador.
    try{
      const backupMeta=JSON.parse(localStorage.getItem(DAILY_BACKUP_META_KEY)||'{}');
      if(backupMeta.date!==today()&&raw.length<=350000){
        localStorage.setItem(DAILY_BACKUP_STORAGE_KEY,raw);
        localStorage.setItem(DAILY_BACKUP_META_KEY,JSON.stringify({date:today(),savedAt,bytes:meta.bytes,version:'4.0'}));
      }
    }catch{}
    const pill=document.getElementById('saveStatusPill');if(pill){pill.title='Última gravação: '+new Date().toLocaleString('pt-PT');pill.classList.remove('save-error')}
    return true;
  }catch(e){const pill=document.getElementById('saveStatusPill');if(pill)pill.classList.add('save-error');notify('Não foi possível guardar no localStorage. Exporta um backup e liberta espaço no navegador.');return false}
}
function restoreStoredSnapshot(key,label){try{const raw=localStorage.getItem(key);if(!raw)return notify(`Não existe ${label.toLowerCase()} neste navegador.`);const recovered=JSON.parse(raw);if(!recovered||typeof recovered!=='object')throw new Error('invalid');if(!confirm(`Restaurar ${label.toLowerCase()}? Os dados atuais serão substituídos. Exporta primeiro um backup atual.`))return;data=deepMerge(structuredClone(EMPTY),recovered);normalizeData();persist();renderAll();notify(`${label} restaurada.`)}catch(e){notify(`A ${label.toLowerCase()} não pôde ser lida. Exporta o que ainda estiver disponível.`)}}
function restoreRecoverySnapshot(){restoreStoredSnapshot(RECOVERY_STORAGE_KEY,'Cópia de recuperação')}
function restoreDailyBackup(){restoreStoredSnapshot(DAILY_BACKUP_STORAGE_KEY,'Cópia automática diária')}
function storageHealth(){try{const raw=localStorage.getItem(STORAGE_KEY)||'',recovery=localStorage.getItem(RECOVERY_STORAGE_KEY)||'',dailyRaw=localStorage.getItem(DAILY_BACKUP_STORAGE_KEY)||'',metaRaw=localStorage.getItem(STORAGE_KEY+'_meta')||'',dailyMetaRaw=localStorage.getItem(DAILY_BACKUP_META_KEY)||'',meta=JSON.parse(metaRaw||'{}'),daily=JSON.parse(dailyMetaRaw||'{}');return{bytes:new Blob([raw]).size,backupBytes:new Blob([recovery,dailyRaw]).size,totalBytes:new Blob([raw,recovery,dailyRaw,metaRaw,dailyMetaRaw]).size,savedAt:meta.savedAt||null,recovery:!!recovery,dailyBackup:!!dailyRaw,dailyBackupDate:daily.date||null,dailyBackupBytes:Number(daily.bytes)||0}}catch{return{bytes:0,backupBytes:0,totalBytes:0,savedAt:null,recovery:false,dailyBackup:false,dailyBackupDate:null,dailyBackupBytes:0}}}
function saveAndRender(message){if(typeof updateDailyMissionRewards==='function')updateDailyMissionRewards();const saved=persist();renderAll();const earned=pendingXP;pendingXP=0;if(message&&saved)notify(message+(earned?` · +${earned} XP`:''))}
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function dateObj(s){return new Date(`${s}T12:00:00`)}
function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function fmt(s,opts={day:'2-digit',month:'short',year:'numeric'}){return s?dateObj(s).toLocaleDateString('pt-PT',opts):'—'}
function monthKey(s=today()){return s.slice(0,7)}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function num(v){const n=Number(v);return Number.isFinite(n)&&n>0?n:0}
function id(){return Date.now()+Math.floor(Math.random()*1000)}
let toastTimer;function notify(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2800)}
function setDateInputs(){['workDate','disciplineDate','weightDate','journalDate','nutritionDateInput','sleepDate','measurementDate'].forEach(x=>{const el=document.getElementById(x);if(el&&!el.value)el.value=today()})}
