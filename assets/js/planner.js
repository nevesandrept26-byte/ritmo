/** RITMO · Planeamento semanal ajustável. */
const PLANNER_DAYS=['Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado','Domingo'];
function renderPlanner(){const el=document.getElementById('plannerGrid');if(!el)return;el.innerHTML=PLANNER_DAYS.map((day,i)=>`<div class="planner-day"><div class="planner-day-head"><strong>${day}</strong>${i>=5?'<span class="tag violet">FIM DE SEMANA</span>':'<span class="tag lime">SEMANA</span>'}</div><textarea data-planner-day="${i}" rows="4" placeholder="Ex.: Tempo com Deus, treino, estudo, caminhada, descanso...">${esc(data.planner[i]||'')}</textarea></div>`).join('')}
function currentWeekKey(){const d=dateObj(today());d.setDate(d.getDate()-((d.getDay()+6)%7));return dateKey(d)}
function savePlanner(){const fields=[...document.querySelectorAll('[data-planner-day]')];fields.forEach(x=>data.planner[x.dataset.plannerDay]=x.value.trim());giveXP(`planner:${currentWeekKey()}`,10,'Planeamento semanal');saveAndRender('Planeamento semanal guardado.')}
function clearPlanner(){if(!confirm('Queres limpar o planeamento desta semana?'))return;data.planner={};saveAndRender('Planeamento limpo.')}
