/** RITMO 4.1 · Grelhas anuais de consistência, inspiradas no GitHub Contributions. */
'use strict';

const CONTRIBUTION_PAGES = {
  home:       {type:'all',       title:'A tua atividade ao longo do ano', subtitle:'Uma visão conjunta dos pequenos passos que registaste em todos os pilares.'},
  focus:      {type:'focus',     title:'O teu percurso de conquistas', subtitle:'Dias em que ganhaste experiência e registaste marcos.'},
  assistant:  {type:'assistant', title:'Dias em que usaste o RITMO AI', subtitle:'Histórico local das conversas com o teu assistente.'},
  faith:      {type:'faith',     title:'Dias de leitura e oração', subtitle:'Os capítulos são marcados como lidos diretamente na Bíblia completa.'},
  gym:        {type:'gym',       title:'Dias de treino', subtitle:'Cada sessão guardada conta para a tua consistência no ginásio.'},
  discipline: {type:'discipline',title:'Dias sem lust', subtitle:'Verde assinala um dia concluído; vermelho identifica um dia registado como não concluído.'},
  habits:     {type:'habits',    title:'Consistência dos teus hábitos', subtitle:'Cada quadrado mostra quantos hábitos assinalaste em cada dia.'},
  nutrition:  {type:'nutrition', title:'Dias a cumprir o plano alimentar', subtitle:'Marca os dias em que cumpriste o objetivo alimentar que definiste.'},
  journal:    {type:'journal',   title:'Dias de reflexão e objetivos', subtitle:'Os dias em que escreveste no diário ficam assinalados.'},
  insights:   {type:'all',       title:'O teu ano em contribuições', subtitle:'Treino, fé, nutrição, hábitos e reflexão numa só vista.'},
  planner:    {type:'all',       title:'Atividade e consistência', subtitle:'Consulta os dias em que transformaste intenção em ação.'},
  recovery:   {type:'recovery',  title:'Sono e recuperação', subtitle:'Dias em que registaste o teu descanso e recuperação.'},
  data:       {type:'all',       title:'Histórico de atividade neste dispositivo', subtitle:'Resumo dos registos locais do RITMO.'}
};

function contributionDate(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : '';
  }
  return '';
}
function contributionAdd(map, date, count=1, state='') {
  const key = contributionDate(date);
  if (!key) return;
  const current = map.get(key) || {count:0,state:''};
  current.count += Math.max(0, Number(count)||0);
  if (state === 'missed') current.state = 'missed';
  else if (state === 'done' && current.state !== 'missed') current.state = 'done';
  map.set(key,current);
}
function contributionBuild(type) {
  const map = new Map();
  const add = (date,count=1,state='') => contributionAdd(map,date,count,state);
  const completed = data.bibleReader?.completed || {};
  const faithDays = data.faithDays || {};
  const nutrition = data.nutrition || {};
  const habits = data.habitChecks || {};
  const discipline = data.discipline || {};
  const xpEvents = Object.values(data.gamification?.events || {});

  const addAll = () => {
    (data.workouts||[]).forEach(x=>add(x.date,1));
    Object.entries(completed).forEach(([,date])=>add(typeof date==='string'?date:today(),1));
    (data.prayers||[]).forEach(x=>add(x.date,1));
    Object.entries(faithDays).forEach(([date,v])=>{if(v?.prayed||v?.grateful||String(v?.gratitude||'').trim())add(date,1)});
    Object.entries(discipline).forEach(([date,v])=>{if(v?.clean)add(date,1,'done')});
    Object.entries(nutrition).forEach(([date,day])=>{if(day?.dietOnTrack===true)add(date,1,'done');else if((day?.meals||[]).length)add(date,Math.min(4,(day.meals||[]).length))});
    Object.entries(habits).forEach(([date,checks])=>add(date,Object.values(checks||{}).filter(Boolean).length));
    (data.journal||[]).forEach(x=>add(x.date,1));
    (data.sleep||[]).forEach(x=>add(x.date,1));
  };

  if (type==='all') addAll();
  else if (type==='focus') xpEvents.forEach(x=>add(x.date||x.at,1));
  else if (type==='assistant') (data.assistant?.messages||[]).filter(x=>x.role==='user').forEach(x=>add(x.at||x.date,1));
  else if (type==='faith') {
    Object.entries(completed).forEach(([,date])=>add(typeof date==='string'?date:today(),1));
    (data.prayers||[]).forEach(x=>add(x.date,1));
    Object.entries(faithDays).forEach(([date,v])=>{if(v?.prayed||v?.grateful)add(date,1)});
  }
  else if (type==='gym') (data.workouts||[]).forEach(x=>add(x.date,1));
  else if (type==='discipline') Object.entries(discipline).forEach(([date,v])=>{if(v?.clean)add(date,1,'done');else if(v&&v.clean===false)add(date,0,'missed')});
  else if (type==='habits') Object.entries(habits).forEach(([date,checks])=>add(date,Object.values(checks||{}).filter(Boolean).length));
  else if (type==='nutrition') Object.entries(nutrition).forEach(([date,day])=>{if(day?.dietOnTrack===true)add(date,1,'done')});
  else if (type==='journal') (data.journal||[]).forEach(x=>add(x.date,1));
  else if (type==='recovery') {(data.sleep||[]).forEach(x=>add(x.date,1));Object.entries(data.recoveryDays||{}).forEach(([date,done])=>{if(done)add(date,1)})}
  return map;
}
function contributionLevel(entry) {
  if (!entry || !entry.count) return 0;
  if (entry.count >= 5) return 4;
  if (entry.count >= 3) return 3;
  if (entry.count >= 2) return 2;
  return 1;
}
function contributionDateObject(key) { return new Date(`${key}T12:00:00`); }
function contributionGridMarkup(pageId, config) {
  const map = contributionBuild(config.type);
  const now = contributionDateObject(today());
  const weekStart = new Date(now); weekStart.setDate(weekStart.getDate()-((weekStart.getDay()+6)%7));
  const start = new Date(weekStart); start.setDate(start.getDate()-52*7);
  const weeks=[];
  for(let w=0;w<53;w++){
    const days=[];
    for(let d=0;d<7;d++){
      const date=new Date(start);date.setDate(start.getDate()+w*7+d);
      const key=dateKey(date),future=key>today(),entry=future?null:map.get(key),level=contributionLevel(entry);
      let title=`${fmt(key,{day:'numeric',month:'long',year:'numeric'})}: sem atividade registada`;
      if(entry?.state==='missed')title=`${fmt(key,{day:'numeric',month:'long',year:'numeric'})}: dia registado como não concluído`;
      else if(entry?.count)title=`${fmt(key,{day:'numeric',month:'long',year:'numeric'})}: ${entry.count} ${entry.count===1?'atividade':'atividades'} registada(s)`;
      const state=entry?.state==='missed'?' data-state="missed"':'';
      const click=(!future&&['discipline','nutrition','gym','faith'].includes(config.type))?` onclick="openContributionDate('${config.type}','${key}')"`:'';
      days.push(`<button class="contribution-cell level-${level}${future?' future':''}" type="button" data-date="${key}" aria-label="${esc(title)}" title="${esc(title)}"${state}${future?' disabled':''}${click}></button>`);
    }
    weeks.push(`<div class="contribution-week">${days.join('')}</div>`);
  }
  const monthGroups=[];let current=null;
  weeks.forEach((_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i*7);const label=d.toLocaleDateString('pt-PT',{month:'short'});if(!current||current.label!==label){current={label,start:i,span:1};monthGroups.push(current)}else current.span++});
  const months=monthGroups.map(m=>`<span style="grid-column:${m.start+1}/span ${m.span}">${esc(m.label)}</span>`).join('');
  const activeDays=[...map.values()].filter(x=>x.count>0||x.state==='missed').length;
  const total=map.size;
  const mapId=`contribution-${pageId}`;
  return `<div class="panel contribution-panel" id="${mapId}" data-contribution-type="${config.type}">
    <div class="panel-head contribution-head"><div><h3>${esc(config.title)}</h3><div class="tiny muted">${esc(config.subtitle)}</div></div><div class="contribution-total"><strong>${activeDays}</strong><small>dias assinalados</small></div></div>
    <div class="contribution-scroll"><div class="contribution-months" style="grid-template-columns:repeat(53,var(--contribution-cell))">${months}</div>
      <div class="contribution-layout"><div class="contribution-weekdays"><span>Seg</span><span></span><span>Qua</span><span></span><span>Sex</span><span></span><span></span></div><div class="contribution-grid">${weeks.join('')}</div></div>
    </div>
    <div class="contribution-footer"><span class="tiny muted">${fmt(dateKey(start))} – ${fmt(today())}</span><div class="contribution-legend"><span>Menos</span><i class="level-0"></i><i class="level-1"></i><i class="level-2"></i><i class="level-3"></i><i class="level-4"></i>${config.type==='discipline' ? '<i class="missed-swatch"></i><span>Mais / não concluído</span>' : '<span>Mais atividade</span>'}</div></div>
  </div>`;
}
function ensureContributionPanels() {
  document.querySelectorAll('.page[id^="page-"]').forEach(page=>{
    const pageId=page.id.replace('page-','');
    if(!CONTRIBUTION_PAGES[pageId]||page.querySelector('.contribution-panel'))return;
    const config=CONTRIBUTION_PAGES[pageId],panel=document.createElement('div');
    panel.innerHTML=contributionGridMarkup(pageId,config);
    const node=panel.firstElementChild;
    if(pageId==='home'){
      const anchor=page.querySelector('#homeStatsGrid')||page.querySelector('.hero');
      if(anchor?.nextSibling)anchor.parentNode.insertBefore(node,anchor.nextSibling);else page.appendChild(node);
    }else{
      const head=page.querySelector('.page-head');
      if(head?.nextSibling)head.parentNode.insertBefore(node,head.nextSibling);else page.insertBefore(node,page.firstChild);
    }
  });
}
function renderAllContributionMaps() {
  ensureContributionPanels();
  Object.entries(CONTRIBUTION_PAGES).forEach(([pageId,config])=>{
    const host=document.getElementById(`contribution-${pageId}`);if(!host)return;
    const fresh=document.createElement('div');fresh.innerHTML=contributionGridMarkup(pageId,config);
    const replacement=fresh.firstElementChild;
    if(replacement)host.replaceWith(replacement);
  });
}
function openContributionDate(type,date) {
  if(type==='discipline'){
    const input=document.getElementById('disciplineDate');if(input)input.value=date;
    const entry=data.discipline?.[date]||{};const check=document.getElementById('cleanDay'),reflection=document.getElementById('disciplineReflection');
    if(check)check.checked=!!entry.clean;if(reflection)reflection.value=entry.reflection||'';
    document.getElementById('page-discipline')?.querySelector('.panel:not(.contribution-panel)')?.scrollIntoView({behavior:'smooth',block:'center'});
  }else if(type==='nutrition'){
    const input=document.getElementById('nutritionDateInput');if(input){input.value=date;renderNutrition();input.scrollIntoView({behavior:'smooth',block:'center'})}
  }else if(type==='gym'){
    const input=document.getElementById('workDate');if(input){input.value=date;input.scrollIntoView({behavior:'smooth',block:'center'})}
  }else if(type==='faith'){
    const entry=Object.entries(data.bibleReader?.completed||{}).find(([,d])=>d===date);
    if(entry&&typeof BIBLE_BOOKS!=='undefined'){
      const [key]=entry,[book,chapter]=key.split(':'),select=document.getElementById('bibleBookSelect');
      if(select)select.value=book;bibleCurrentBook=book;bibleCurrentChapter=Number(chapter)||1;populateBibleChapterSelect();loadBibleBook(book,bibleCurrentChapter);
      document.getElementById('bibleReaderPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
    }
  }
}
