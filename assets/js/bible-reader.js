/** RITMO · Leitor bíblico completo (Almeida 1911, domínio público). */
const BIBLE_BOOKS = [
 ['gn','Gênesis',50,'AT'],['ex','Êxodo',40,'AT'],['lv','Levítico',27,'AT'],['nm','Números',36,'AT'],['dt','Deuteronômio',34,'AT'],['js','Josué',24,'AT'],['jz','Juízes',21,'AT'],['rt','Rute',4,'AT'],['1sm','1 Samuel',31,'AT'],['2sm','2 Samuel',24,'AT'],['1rs','1 Reis',22,'AT'],['2rs','2 Reis',25,'AT'],['1cr','1 Crônicas',29,'AT'],['2cr','2 Crônicas',36,'AT'],['ed','Esdras',10,'AT'],['ne','Neemias',13,'AT'],['et','Ester',10,'AT'],['job','Jó',42,'AT'],['sl','Salmos',150,'AT'],['pv','Provérbios',31,'AT'],['ec','Eclesiastes',12,'AT'],['ct','Cânticos',8,'AT'],['is','Isaías',66,'AT'],['jr','Jeremias',52,'AT'],['lm','Lamentações de Jeremias',5,'AT'],['ez','Ezequiel',48,'AT'],['dn','Daniel',12,'AT'],['os','Oséias',14,'AT'],['jl','Joel',3,'AT'],['am','Amós',9,'AT'],['ob','Obadias',1,'AT'],['jn','Jonas',4,'AT'],['mq','Miquéias',7,'AT'],['na','Naum',3,'AT'],['hc','Habacuque',3,'AT'],['sf','Sofonias',3,'AT'],['ag','Ageu',2,'AT'],['zc','Zacarias',14,'AT'],['ml','Malaquias',4,'AT'],['mt','Mateus',28,'NT'],['mc','Marcos',16,'NT'],['lc','Lucas',24,'NT'],['jo','João',21,'NT'],['at','Atos',28,'NT'],['rm','Romanos',16,'NT'],['1co','1 Coríntios',16,'NT'],['2co','2 Coríntios',13,'NT'],['gl','Gálatas',6,'NT'],['ef','Efésios',6,'NT'],['fp','Filipenses',4,'NT'],['cl','Colossenses',4,'NT'],['1ts','1 Tessalonicenses',5,'NT'],['2ts','2 Tessalonicenses',3,'NT'],['1tm','1 Timóteo',6,'NT'],['2tm','2 Timóteo',4,'NT'],['tt','Tito',3,'NT'],['fm','Filemom',1,'NT'],['hb','Hebreus',13,'NT'],['tg','Tiago',5,'NT'],['1pe','1 Pedro',5,'NT'],['2pe','2 Pedro',3,'NT'],['1jo','1 João',5,'NT'],['2jo','2 João',1,'NT'],['3jo','3 João',1,'NT'],['jd','Judas',1,'NT'],['ap','Apocalipse',22,'NT']
].map(([abbrev,name,chapters,testament])=>({abbrev,name,chapters,testament}));
const BIBLE_DATA_ROOT='https://raw.githubusercontent.com/Projeto-Euaggelion/biblia.publica/main/versoes/alm1911/json/';
let bibleCurrentBook='gn', bibleCurrentChapter=1, bibleLoadedBook=null, bibleLoadPromise=null;
const bibleBookMemory=new Map();
let bibleDbPromise=null;
function bibleDB(){if(bibleDbPromise)return bibleDbPromise;bibleDbPromise=new Promise((resolve,reject)=>{if(!('indexedDB'in window))return reject(new Error('IndexedDB indisponível'));const req=indexedDB.open('ritmo-library-cache-v1',1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('bible'))db.createObjectStore('bible',{keyPath:'abbrev'});if(!db.objectStoreNames.contains('misc'))db.createObjectStore('misc',{keyPath:'key'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});return bibleDbPromise}
async function bibleCacheGet(abbrev){try{const db=await bibleDB();return await new Promise((resolve,reject)=>{const r=db.transaction('bible','readonly').objectStore('bible').get(abbrev);r.onsuccess=()=>resolve(r.result?.book||null);r.onerror=()=>reject(r.error)})}catch{return null}}
async function bibleCachePut(book){try{const db=await bibleDB();await new Promise((resolve,reject)=>{const r=db.transaction('bible','readwrite').objectStore('bible').put({abbrev:book.abbrev,book,savedAt:Date.now()});r.onsuccess=resolve;r.onerror=()=>reject(r.error)})}catch{}}
function bibleNormalise(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function initBibleReader(){const select=document.getElementById('bibleBookSelect');if(!select)return;select.innerHTML=`<optgroup label="Antigo Testamento">${BIBLE_BOOKS.filter(b=>b.testament==='AT').map(b=>`<option value="${b.abbrev}">${esc(b.name)}</option>`).join('')}</optgroup><optgroup label="Novo Testamento">${BIBLE_BOOKS.filter(b=>b.testament==='NT').map(b=>`<option value="${b.abbrev}">${esc(b.name)}</option>`).join('')}</optgroup>`;const saved=data.bibleReader||{};data.bibleReader=data.bibleReader||{};data.bibleReader.explanations=data.bibleReader.explanations||{};bibleCurrentBook=BIBLE_BOOKS.some(b=>b.abbrev===saved.lastBook)?saved.lastBook:'gn';bibleCurrentChapter=Math.max(1,Number(saved.lastChapter)||1);select.value=bibleCurrentBook;populateBibleChapterSelect();loadBibleBook(bibleCurrentBook,bibleCurrentChapter);renderBibleReaderProgress();renderBibleFavorites()}
function populateBibleChapterSelect(){const book=BIBLE_BOOKS.find(b=>b.abbrev===bibleCurrentBook)||BIBLE_BOOKS[0],el=document.getElementById('bibleChapterSelect');if(!el)return;const completed=data.bibleReader?.completed||{};el.innerHTML=Array.from({length:book.chapters},(_,i)=>{const n=i+1,read=!!completed[`${book.abbrev}:${n}`];return `<option value="${n}">${read?'✓ ':''}Capítulo ${n}${read?' · lido':''}</option>`}).join('');bibleCurrentChapter=Math.min(book.chapters,Math.max(1,bibleCurrentChapter));el.value=String(bibleCurrentChapter);const progress=document.getElementById('bibleBookProgress');if(progress){const done=Array.from({length:book.chapters},(_,i)=>completed[`${book.abbrev}:${i+1}`]).filter(Boolean).length;progress.textContent=`${book.name}: ${done}/${book.chapters} capítulos lidos`}}
async function loadBibleBook(abbrev,chapter=1){const bookMeta=BIBLE_BOOKS.find(b=>b.abbrev===abbrev);if(!bookMeta)return;if(bibleLoadedBook?.abbrev===abbrev){bibleCurrentBook=abbrev;bibleCurrentChapter=chapter;populateBibleChapterSelect();renderBibleChapter();return}const status=document.getElementById('bibleReaderStatus');if(status)status.textContent=`A carregar ${bookMeta.name}…`;const panel=document.getElementById('bibleChapterText');if(panel)panel.innerHTML='<div class="empty">A carregar o texto bíblico…</div>';try{if(bibleLoadPromise&&bibleLoadPromise.abbrev===abbrev){await bibleLoadPromise.promise;bibleLoadedBook=bibleBookMemory.get(abbrev)}else{const promise=(async()=>{let book=bibleBookMemory.get(abbrev)||await bibleCacheGet(abbrev);if(!book){const response=await fetch(`${BIBLE_DATA_ROOT}alm1911-${abbrev}.json`);if(!response.ok)throw new Error(`Não foi possível carregar ${bookMeta.name} (HTTP ${response.status}).`);book=await response.json();if(!book?.chapters?.length)throw new Error('O ficheiro do livro não tem capítulos válidos.');await bibleCachePut(book)}bibleBookMemory.set(abbrev,book);return book})();bibleLoadPromise={abbrev,promise};bibleLoadedBook=await promise;bibleLoadPromise=null}bibleCurrentBook=abbrev;bibleCurrentChapter=chapter;populateBibleChapterSelect();if(status)status.textContent=`${bookMeta.name} disponível · ${bibleLoadedBook.chapters.length} capítulos · ficará guardado neste dispositivo depois de carregar.`;data.bibleReader=data.bibleReader||{};data.bibleReader.lastBook=abbrev;data.bibleReader.lastChapter=chapter;persist();renderBibleChapter()}catch(error){bibleLoadPromise=null;if(status)status.textContent=`Não foi possível carregar o texto. Verifica a Internet e tenta novamente. ${error.message}`;if(panel)panel.innerHTML=`<div class="empty">O texto ainda não está disponível neste dispositivo.<br/><button class="btn secondary sm" type="button" onclick="loadBibleBook('${abbrev}',${chapter})" style="margin-top:10px">Tentar novamente</button></div>`}}
function onBibleBookChange(){const s=document.getElementById('bibleBookSelect');bibleCurrentBook=s.value;bibleCurrentChapter=1;populateBibleChapterSelect();loadBibleBook(bibleCurrentBook,1)}
function onBibleChapterChange(){bibleCurrentChapter=Number(document.getElementById('bibleChapterSelect').value)||1;if(bibleLoadedBook?.abbrev===bibleCurrentBook){data.bibleReader=data.bibleReader||{};data.bibleReader.lastBook=bibleCurrentBook;data.bibleReader.lastChapter=bibleCurrentChapter;persist();renderBibleChapter()}else loadBibleBook(bibleCurrentBook,bibleCurrentChapter)}
function renderBibleChapter(){
  const book=bibleLoadedBook;if(!book||book.abbrev!==bibleCurrentBook)return;
  const chapter=book.chapters[bibleCurrentChapter-1];if(!chapter)return;
  const meta=BIBLE_BOOKS.find(b=>b.abbrev===bibleCurrentBook),title=document.getElementById('bibleChapterTitle'),body=document.getElementById('bibleChapterText');
  if(title)title.textContent=`${meta.name} ${bibleCurrentChapter}`;
  const completed=data.bibleReader?.completed||{},isRead=!!completed[`${bibleCurrentBook}:${bibleCurrentChapter}`];
  const state=document.getElementById('bibleChapterReadState');
  if(state){state.textContent=isRead?'Capítulo lido':'Por ler';state.className=isRead?'tag lime':'tag violet'}
  const doneBtn=document.getElementById('markBibleChapterButton');
  if(doneBtn){doneBtn.textContent=isRead?'✓ Capítulo concluído':'Marcar capítulo como lido ✓';doneBtn.disabled=isRead;doneBtn.title=isRead?'Este capítulo já está marcado como lido':'Marcar este capítulo como lido'}
  if(body){
    const explanations=data.bibleReader?.explanations||{};
    body.innerHTML=chapter.verses.map((v,index)=>{
      const key=`${bibleCurrentBook}:${bibleCurrentChapter}:${v.number}`;
      const fav=(data.bibleReader?.favorites||[]).some(f=>f.book===bibleCurrentBook&&f.chapter===bibleCurrentChapter&&f.verse===v.number);
      const cached=explanations[key];
      const cachedText=cached?.text?`<div class="bible-explanation-body">${esc(cached.text).replace(/\n/g,'<br>')}</div>`:'<div class="bible-explanation-body">A explicação contextual é gerada localmente pelo Qwen quando a pedires.</div>';
      return `<article class="bible-verse" id="bible-verse-${v.number}">
        <button class="bible-verse-number ${fav?'is-favorite':''}" type="button" title="${fav?'Remover das favoritas':'Guardar versículo'}" onclick="toggleBibleFavorite('${bibleCurrentBook}',${bibleCurrentChapter},${v.number})">${v.number}<span>${fav?'★':'☆'}</span></button>
        <div class="bible-verse-content"><p>${esc(v.text)}</p>
          <details class="bible-explanation" id="bible-explanation-${v.number}" ${cached?.text?'':'data-empty="true"'}>
            <summary>${cached?.text?'Explicação guardada · Qwen local':'✦ Explicar este versículo'}</summary>
            ${cachedText}
            <div class="bible-explanation-actions"><button class="btn ghost sm" type="button" onclick="explainBibleVerse(${v.number},true)">↻ Gerar novamente</button></div>
          </details>
          <button class="bible-explain-trigger" type="button" onclick="explainBibleVerse(${v.number})">✦ ${cached?.text?'Ver explicação':'Explicar versículo'}</button>
        </div>
      </article>`;
    }).join('');
  }
  populateBibleChapterSelect();renderBibleReaderProgress();renderBibleFavorites();
}
async function explainBibleVerse(verseNumber,force=false){
  const chapter=bibleLoadedBook?.chapters?.[bibleCurrentChapter-1];
  const index=chapter?.verses?.findIndex(v=>Number(v.number)===Number(verseNumber));
  if(index===undefined||index<0)return notify('Não consegui encontrar este versículo.');
  data.bibleReader=data.bibleReader||{completed:{},favorites:[],explanations:{}};
  data.bibleReader.explanations=data.bibleReader.explanations||{};
  const key=`${bibleCurrentBook}:${bibleCurrentChapter}:${verseNumber}`;
  const cached=data.bibleReader.explanations[key];
  const details=document.getElementById(`bible-explanation-${verseNumber}`);
  if(!details)return;
  if(cached?.text&&!force){details.open=!details.open;return}
  const verse=chapter.verses[index],previous=chapter.verses[index-1]?.text||'',next=chapter.verses[index+1]?.text||'';
  const summary=details.querySelector('summary'),content=details.querySelector('.bible-explanation-body'),actions=details.querySelector('.bible-explanation-actions'),trigger=details.parentElement.querySelector('.bible-explain-trigger');
  details.open=true;if(summary)summary.textContent='A pedir explicação ao Qwen local…';if(content)content.innerHTML='<span class="bible-explanation-loading">A analisar o versículo no contexto do capítulo. Pode demorar alguns segundos.</span>';if(actions)actions.classList.add('hidden');if(trigger){trigger.disabled=true;trigger.textContent='A explicar…'}
  try{
    const response=await fetch('/api/bible/explain-verse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reference:`${bibleLoadedBook.name} ${bibleCurrentChapter}:${verseNumber}`,verse:verse.text,previous,next})});
    const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||`O servidor respondeu com HTTP ${response.status}.`);
    const text=String(result.explanation||'').trim();if(!text)throw new Error('O modelo não devolveu uma explicação.');
    data.bibleReader.explanations[key]={text,at:new Date().toISOString(),model:result.model||'Ollama local'};
    const keys=Object.keys(data.bibleReader.explanations);if(keys.length>120){keys.sort((a,b)=>(data.bibleReader.explanations[a].at||'').localeCompare(data.bibleReader.explanations[b].at||''));keys.slice(0,keys.length-120).forEach(k=>delete data.bibleReader.explanations[k]);}
    persist();if(summary)summary.textContent='Explicação contextual · Qwen local';if(content)content.innerHTML=esc(text).replace(/\n/g,'<br>');if(actions)actions.classList.remove('hidden');
  }catch(error){if(summary)summary.textContent='Não foi possível explicar este versículo';if(content)content.innerHTML=`${esc(error.message)}<br><small>Confirma que o RITMO e o Ollama estão abertos e que o modelo está instalado.</small>`;if(actions)actions.classList.remove('hidden');}
  finally{if(trigger){trigger.disabled=false;trigger.textContent='✦ Ver explicação'} }
}
function renderBibleReaderProgress(){const completed=data.bibleReader?.completed||{},done=Object.keys(completed).filter(k=>completed[k]).length,total=1189,pct=Math.min(100,done/total*100);const count=document.getElementById('bibleReaderProgress'),percent=document.getElementById('bibleReaderProgressPct'),bar=document.getElementById('bibleReaderProgressBar');if(count)count.textContent=`${done.toLocaleString('pt-PT')} / ${total.toLocaleString('pt-PT')} capítulos lidos`;if(percent)percent.textContent=`${pct.toFixed(1).replace('.',',')}% da Bíblia`;if(bar)bar.style.width=`${pct}%`;const book=BIBLE_BOOKS.find(b=>b.abbrev===bibleCurrentBook),bookProgress=document.getElementById('bibleBookProgress');if(book&&bookProgress){const local=Array.from({length:book.chapters},(_,i)=>completed[`${book.abbrev}:${i+1}`]).filter(Boolean).length;bookProgress.textContent=`${book.name}: ${local}/${book.chapters} capítulos lidos`}}
function markBibleChapterRead(){if(!bibleLoadedBook||bibleLoadedBook.abbrev!==bibleCurrentBook)return notify('Espera que o capítulo termine de carregar.');data.bibleReader=data.bibleReader||{completed:{},favorites:[],explanations:{}};data.bibleReader.completed=data.bibleReader.completed||{};const key=`${bibleCurrentBook}:${bibleCurrentChapter}`;if(data.bibleReader.completed[key])return notify('Este capítulo já está marcado como lido.');data.bibleReader.completed[key]=today();data.faithDays=data.faithDays||{};data.faithDays[today()]=data.faithDays[today()]||{prayed:false,grateful:false,gratitude:''};data.faithDays[today()].read=true;giveXP(`bible-chapter:${key}`,12,`Capítulo lido · ${bibleLoadedBook.name} ${bibleCurrentChapter}`);saveAndRender('Capítulo concluído e guardado na Bíblia completa.');renderBibleChapter()}
function moveBibleChapter(delta){const index=BIBLE_BOOKS.findIndex(b=>b.abbrev===bibleCurrentBook);let nextBook=BIBLE_BOOKS[index],nextChapter=bibleCurrentChapter+delta;if(nextChapter<1){if(index<=0)return;nextBook=BIBLE_BOOKS[index-1];nextChapter=nextBook.chapters}else if(nextChapter>nextBook.chapters){if(index>=BIBLE_BOOKS.length-1)return;nextBook=BIBLE_BOOKS[index+1];nextChapter=1}const select=document.getElementById('bibleBookSelect');if(select)select.value=nextBook.abbrev;bibleCurrentBook=nextBook.abbrev;bibleCurrentChapter=nextChapter;populateBibleChapterSelect();loadBibleBook(bibleCurrentBook,bibleCurrentChapter)}
function openDailyBibleReading(){const completed=data.bibleReader?.completed||{};for(const book of BIBLE_BOOKS){for(let ch=1;ch<=book.chapters;ch++){if(!completed[`${book.abbrev}:${ch}`]){const select=document.getElementById('bibleBookSelect');if(select)select.value=book.abbrev;bibleCurrentBook=book.abbrev;bibleCurrentChapter=ch;populateBibleChapterSelect();loadBibleBook(book.abbrev,ch);return}}}notify('Parabéns: já assinalaste os 1.189 capítulos! Podes continuar a reler qualquer livro.')}
function toggleBibleFavorite(book,chapter,verse){data.bibleReader=data.bibleReader||{completed:{},favorites:[]};data.bibleReader.favorites=data.bibleReader.favorites||[];const existing=data.bibleReader.favorites.findIndex(f=>f.book===book&&f.chapter===chapter&&f.verse===verse);if(existing>=0)data.bibleReader.favorites.splice(existing,1);else{const b=bibleLoadedBook?.abbrev===book?bibleLoadedBook:null,chapterData=b?.chapters[chapter-1],v=chapterData?.verses.find(x=>x.number===verse);if(!v)return;data.bibleReader.favorites.unshift({book,chapter,verse,text:v.text,bookName:b.name})}persist();renderBibleChapter();renderBibleFavorites()}
function renderBibleFavorites(){const el=document.getElementById('bibleReaderFavorites');if(!el)return;const favs=data.bibleReader?.favorites||[];el.innerHTML=favs.slice(0,8).map((f,i)=>`<div class="bible-favorite-row"><div><strong>${esc(f.bookName||BIBLE_BOOKS.find(b=>b.abbrev===f.book)?.name||f.book)} ${f.chapter}:${f.verse}</strong><p>${esc(f.text)}</p></div><button class="icon-btn" type="button" onclick="removeBibleFavorite(${i})" title="Remover favorita">×</button></div>`).join('')||'<div class="empty">Toca na estrela junto a um versículo para o guardar aqui.</div>'}
function removeBibleFavorite(index){data.bibleReader.favorites.splice(index,1);persist();renderBibleFavorites();renderBibleChapter()}
function searchBible(){const input=document.getElementById('bibleSearchInput'),term=input.value.trim(),box=document.getElementById('bibleSearchResults');if(!term)return notify('Escreve uma referência ou palavra para pesquisar.');const ref=term.match(/^(.+?)\s+(\d{1,3})(?::(\d{1,3}))?$/);if(ref){const target=bibleNormalise(ref[1]),book=BIBLE_BOOKS.find(b=>bibleNormalise(b.name)===target||b.abbrev===target||bibleNormalise(b.name.replace(/^\d\s*/,''))===target);if(!book)return notify('Não reconheci esse livro. Experimenta escrever o nome completo.');const ch=Number(ref[2]),verse=ref[3]?Number(ref[3]):null;if(ch<1||ch>book.chapters)return notify('Esse capítulo não existe nesse livro.');const select=document.getElementById('bibleBookSelect');if(select)select.value=book.abbrev;bibleCurrentBook=book.abbrev;bibleCurrentChapter=ch;populateBibleChapterSelect();loadBibleBook(book.abbrev,ch).then(()=>{if(verse){const node=document.getElementById(`bible-verse-${verse}`);node?.scrollIntoView({behavior:'smooth',block:'center'});node?.classList.add('bible-verse-highlight');setTimeout(()=>node?.classList.remove('bible-verse-highlight'),1800)}});box.classList.add('hidden');return}if(!bibleLoadedBook||bibleLoadedBook.abbrev!==bibleCurrentBook)return notify('Carrega primeiro um livro para pesquisar o seu texto.');const query=bibleNormalise(term),matches=[];bibleLoadedBook.chapters.forEach((chapter,ci)=>chapter.verses.forEach(v=>{if(bibleNormalise(v.text).includes(query))matches.push({chapter:ci+1,verse:v.number,text:v.text})}));box.innerHTML=matches.slice(0,30).map(m=>`<button class="bible-search-result" type="button" onclick="openBibleSearchResult(${m.chapter},${m.verse})"><strong>${esc(bibleLoadedBook.name)} ${m.chapter}:${m.verse}</strong><span>${esc(m.text)}</span></button>`).join('')||'<div class="empty">Não encontrei essa palavra no livro atual.</div>';box.classList.remove('hidden');if(matches.length>30)box.insertAdjacentHTML('beforeend',`<div class="tiny muted">A mostrar 30 de ${matches.length} resultados.</div>`)}
function openBibleSearchResult(ch,verse){bibleCurrentChapter=ch;document.getElementById('bibleChapterSelect').value=String(ch);renderBibleChapter();document.getElementById('bibleSearchResults').classList.add('hidden');const node=document.getElementById(`bible-verse-${verse}`);node?.scrollIntoView({behavior:'smooth',block:'center'});node?.classList.add('bible-verse-highlight');setTimeout(()=>node?.classList.remove('bible-verse-highlight'),1800)}

async function downloadFullBibleOffline(){
  const button=document.getElementById('downloadBibleOfflineButton'),progress=document.getElementById('bibleOfflineProgress'),status=document.getElementById('bibleReaderStatus');
  if(button)button.disabled=true;
  let ready=0;
  try{
    for(const meta of BIBLE_BOOKS){
      let book=bibleBookMemory.get(meta.abbrev)||await bibleCacheGet(meta.abbrev);
      if(!book){
        if(!navigator.onLine)throw new Error('Sem ligação à Internet. Os livros já descarregados continuam disponíveis.');
        const response=await fetch(`${BIBLE_DATA_ROOT}alm1911-${meta.abbrev}.json`);
        if(!response.ok)throw new Error(`Falha ao descarregar ${meta.name} (HTTP ${response.status}).`);
        book=await response.json();
        if(!book||!Array.isArray(book.chapters)||book.chapters.length!==meta.chapters)throw new Error(`O ficheiro de ${meta.name} não passou a validação.`);
        book.abbrev=book.abbrev||meta.abbrev;
        book.name=book.name||meta.name;
        await bibleCachePut(book);
      }
      bibleBookMemory.set(meta.abbrev,book);
      ready++;
      const message=`Bíblia offline: ${ready}/${BIBLE_BOOKS.length} livros preparados`;
      if(progress)progress.textContent=message;
      if(status)status.textContent=message+` · ${meta.name} concluído.`;
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    if(progress)progress.textContent='Bíblia completa disponível offline neste dispositivo.';
    if(status)status.textContent='Concluído: os 66 livros e os 1.189 capítulos estão guardados neste dispositivo.';
    if(button)button.textContent='✓ Bíblia guardada para leitura offline';
    notify('Bíblia completa descarregada. Já podes ler sem Internet neste dispositivo.');
  }catch(error){
    if(progress)progress.textContent=`Download interrompido: ${ready}/${BIBLE_BOOKS.length} livros guardados. Podes continuar mais tarde.`;
    if(status)status.textContent=error.message;
    if(button)button.textContent='↻ Continuar download offline';
    notify('Não foi possível concluir o download. Os livros já guardados não foram perdidos.');
  }finally{if(button)button.disabled=false}
}

function renderBibleReader(){renderBibleReaderProgress();renderBibleFavorites();renderBibleChapter()}
