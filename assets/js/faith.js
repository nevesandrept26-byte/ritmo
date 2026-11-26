/** RITMO · Caminho com Deus: oração, gratidão e leitor bíblico integrado. */
function renderFaith(){
  const f=data.faithDays[today()]||{prayed:false,grateful:false,gratitude:''};
  const checks=document.getElementById('faithTodayChecks');
  if(checks)checks.innerHTML=`
    <label class="quick-row"><input type="checkbox" ${f.prayed?'checked':''} onchange="updateFaithCheck('prayed',this.checked)"><span><b>Reservei um momento para orar</b><small>Falei com Deus com intenção e sinceridade.</small></span></label>
    <label class="quick-row"><input type="checkbox" ${f.grateful?'checked':''} onchange="updateFaithCheck('grateful',this.checked)"><span><b>Pratiquei gratidão</b><small>Reconheci algo pelo qual estou grato.</small></span></label>`;
  const gratitude=document.getElementById('gratitude');if(gratitude)gratitude.value=f.gratitude||'';
  const verse=document.getElementById('faithVerse'),ref=document.getElementById('faithVerseRef');
  if(verse)verse.textContent=VERSES[verseIndex][0];if(ref)ref.textContent=VERSES[verseIndex][1];
  const prayerHistory=document.getElementById('prayerHistory');
  if(prayerHistory)prayerHistory.innerHTML=(data.prayers||[]).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,5).map(p=>`<div class="record"><div class="record-top"><div><div class="record-title">♡ ${esc(p.type||'Oração')}</div><div class="record-meta">${fmt(p.date)}</div></div><button class="icon-btn" onclick="deleteRecord('prayers','${p.id}')" aria-label="Apagar oração">Apagar</button></div><div class="record-notes">${esc(p.text||'')}</div></div>`).join('')||'<div class="empty">As tuas orações guardadas aparecem aqui.</div>';
  const requests=document.getElementById('prayerRequests');
  if(requests)requests.innerHTML=(data.requests||[]).map(r=>`<div class="goal-row"><input type="checkbox" ${r.answered?'checked':''} onchange="toggleRequest('${r.id}',this.checked)"><div><strong style="${r.answered?'text-decoration:line-through;opacity:.6':''}">${esc(r.text)}</strong><small>${r.answered?'Respondido / entregue':'Pedido de oração'}</small></div><button class="icon-btn" onclick="deleteRecord('requests','${r.id}')" aria-label="Apagar pedido">×</button></div>`).join('')||'<div class="empty">Adiciona um pedido de oração para o acompanhar.</div>';
  if(typeof renderBibleReaderProgress==='function'){renderBibleReaderProgress();renderBibleFavorites();renderBibleChapter()}
}
function updateFaithCheck(k,v){
  if(!['prayed','grateful'].includes(k))return;
  data.faithDays[today()]=data.faithDays[today()]||{prayed:false,grateful:false,gratitude:''};
  data.faithDays[today()][k]=v;
  if(v)giveXP(`faith-check:${today()}:${k}`,8,k==='prayed'?'Momento de oração':'Momento de gratidão');
  saveAndRender();
}
function saveFaithDay(){
  data.faithDays[today()]=data.faithDays[today()]||{prayed:false,grateful:false,gratitude:''};
  data.faithDays[today()].gratitude=document.getElementById('gratitude')?.value.trim()||'';
  if(data.faithDays[today()].gratitude)giveXP(`gratitude:${today()}`,5,'Gratidão registada');
  saveAndRender('Momento guardado.');
}
function newVerse(){verseIndex=(verseIndex+1)%VERSES.length;renderFaith();renderHome()}
function addPrayer(){
  const text=document.getElementById('prayerText').value.trim();if(!text)return notify('Escreve a tua oração primeiro.');
  const entry={id:id(),date:today(),type:document.getElementById('prayerType').value,text};data.prayers.unshift(entry);
  giveXP(`prayer-entry:${entry.date}:${entry.id}`,12,'Oração registada');document.getElementById('prayerText').value='';saveAndRender('Oração guardada.');
}
function addPrayerRequest(){const text=document.getElementById('requestText').value.trim();if(!text)return notify('Escreve o pedido primeiro.');data.requests.unshift({id:id(),text,answered:false,created:today()});document.getElementById('requestText').value='';saveAndRender('Pedido adicionado.')}
function toggleRequest(i,v){const r=data.requests.find(x=>String(x.id)===String(i));if(r)r.answered=v;saveAndRender()}
