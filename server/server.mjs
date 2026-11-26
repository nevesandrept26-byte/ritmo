import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Configuração opcional e local. Não existe chave de cloud nem envio da fotografia para fora.
try {
  const envText = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
} catch {}

const PORT = Number(process.env.PORT || 8000);
const HOST = '127.0.0.1';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:4b';
const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const ollamaUrl = new URL(OLLAMA_BASE_URL);
if (ollamaUrl.protocol !== 'http:' || !['127.0.0.1', 'localhost', '::1'].includes(ollamaUrl.hostname)) {
  throw new Error('OLLAMA_BASE_URL tem de apontar para localhost/127.0.0.1. O RITMO não envia fotografias para servidores remotos.');
}

const searchCache = new Map();
const mimeTypes = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'};
function sendJson(res, status, payload) {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(JSON.stringify(payload));
}
async function readJson(req, maxBytes = 12 * 1024 * 1024) {
  const chunks = []; let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) throw Object.assign(new Error('O pedido é demasiado grande. Usa uma fotografia até 8 MB.'), {status:413});
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('O pedido não contém JSON válido.'), {status:400}); }
}
function isLocalRequest(req) {
  const allowedHosts = new Set([`${HOST}:${PORT}`, `localhost:${PORT}`]);
  const host = String(req.headers.host || '').toLowerCase();
  if (!allowedHosts.has(host)) return false;
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'http:' && allowedHosts.has(parsed.host.toLowerCase());
  } catch { return false; }
}

async function ollamaFetch(route, options = {}, timeoutMs = 5000) {
  try {
    return await fetch(`${OLLAMA_BASE_URL}${route}`, {...options, signal: AbortSignal.timeout(timeoutMs)});
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') throw Object.assign(new Error('O Ollama demorou demasiado tempo a responder. Confirma se está aberto e a funcionar.'), {status:504});
    throw Object.assign(new Error('Não foi possível ligar ao Ollama neste computador. Instala o Ollama, abre-o e volta a verificar.'), {status:503});
  }
}
async function getOllamaHealth() {
  try {
    const response = await ollamaFetch('/api/tags', {headers:{Accept:'application/json'}}, 3500);
    if (!response.ok) return {ollamaConnected:false, modelInstalled:false, model:OLLAMA_MODEL, error:`Ollama respondeu com HTTP ${response.status}.`};
    const payload = await response.json();
    const models = Array.isArray(payload.models) ? payload.models : [];
    const modelInstalled = models.some(item => [item.name, item.model].includes(OLLAMA_MODEL));
    return {ollamaConnected:true, modelInstalled, model:OLLAMA_MODEL, installedModels:models.map(item => item.name || item.model).filter(Boolean)};
  } catch (error) {
    return {ollamaConnected:false, modelInstalled:false, model:OLLAMA_MODEL, error:error.message};
  }
}

function getProductsPayload(payload) {
  return (payload?.products || []).map(p => {
    const n = p.nutriments || {};
    const value = (...keys) => { for (const key of keys) { const v = Number(n[key]); if (Number.isFinite(v) && v >= 0) return v; } return 0; };
    let kcal = value('energy-kcal_100g','energy-kcal_value','energy-kcal');
    if (!kcal) { const kj = value('energy-kj_100g','energy-kj_value','energy-kj'); if (kj) kcal = kj / 4.184; }
    return {name:p.product_name||p.product_name_pt||p.product_name_en||'',brand:p.brands||'',code:p.code||'',quantity:p.quantity||'',image:p.image_front_small_url||p.image_front_url||p.image_url||'',kcal:Math.round(kcal*10)/10,protein:value('proteins_100g'),carbs:value('carbohydrates_100g'),fat:value('fat_100g'),fiber:value('fiber_100g'),source:'Open Food Facts'};
  }).filter(p => p.name && (p.kcal || p.protein || p.carbs || p.fat));
}
async function searchFoods(query) {
  const key = query.trim().toLocaleLowerCase('pt-PT');
  const cached = searchCache.get(key);
  if (cached && Date.now() - cached.time < 60_000) return {...cached.value, cached:true};
  const fields = 'code,product_name,product_name_pt,product_name_en,brands,quantity,nutriments,image_front_small_url,image_front_url';
  let url;
  if (/^\d{8,14}$/.test(query.trim())) url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(query.trim())}.json?fields=${encodeURIComponent(fields)}&lc=pt&cc=pt`;
  else {
    const params = new URLSearchParams({search_terms:query.trim(),search_simple:'1',action:'process',json:'1',page_size:'20',fields,lc:'pt',cc:'pt'});
    url = `https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`;
  }
  const upstream = await fetch(url, {headers:{'Accept':'application/json','User-Agent':'RITMO-Personal-Tracker/3.6 (local nutrition diary)'},signal:AbortSignal.timeout(12_000)});
  if (!upstream.ok) throw new Error(`Open Food Facts respondeu com HTTP ${upstream.status}.`);
  const payload = await upstream.json();
  const products = /^\d{8,14}$/.test(query.trim()) ? (payload.status === 1 && payload.product ? getProductsPayload({products:[payload.product]}) : []) : getProductsPayload(payload);
  const value = {query:query.trim(),products,count:products.length,provider:'Open Food Facts'};
  searchCache.set(key, {time:Date.now(),value});
  return value;
}

const foodSchema = {
  type:'object', additionalProperties:false,
  properties:{
    foods:{type:'array',items:{type:'object',additionalProperties:false,properties:{
      name:{type:'string'},portion_grams:{type:'number'},kcal_per_100g:{type:'number'},protein_per_100g:{type:'number'},carbs_per_100g:{type:'number'},fat_per_100g:{type:'number'},fiber_per_100g:{type:'number'},confidence:{type:'string',enum:['baixa','media','alta']},note:{type:'string'}
    },required:['name','portion_grams','kcal_per_100g','protein_per_100g','carbs_per_100g','fat_per_100g','fiber_per_100g','confidence','note']}},
    total_kcal_low:{type:'number'},total_kcal_high:{type:'number'},confidence:{type:'string',enum:['baixa','media','alta']},assumptions:{type:'string'}
  }, required:['foods','total_kcal_low','total_kcal_high','confidence','assumptions']
};
function extractFirstJsonObject(text) {
  const source = String(text || '').replace(/^\uFEFF/, '').trim();
  if (!source) return null;
  const full = source.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    const direct = JSON.parse(full);
    if (direct && typeof direct === 'object') return direct;
  } catch {}

  // Tenta cada objeto balanceado; isto também tolera frases, fences e exemplos antes/depois do JSON final.
  for (let first = source.indexOf('{'); first >= 0; first = source.indexOf('{', first + 1)) {
    let depth = 0, inString = false, escaped = false;
    for (let i = first; i < source.length; i++) {
      const ch = source[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') inString = true;
      else if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          try {
            const parsed = JSON.parse(source.slice(first, i + 1));
            if (parsed && typeof parsed === 'object') return parsed;
          } catch {}
          break;
        }
      }
    }
  }
  return null;
}
function parseModelJson(content, thinking = '') {
  // Ollama pode devolver o raciocínio separado do texto final. Nunca o usamos como resultado.
  let text = '';
  if (typeof content === 'string') text = content;
  else if (Array.isArray(content)) text = content.map(part => typeof part === 'string' ? part : part?.text || '').join('\n');
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const parsed = extractFirstJsonObject(text);
  if (parsed) {
    // Alguns modelos colocam o objeto útil dentro de uma propriedade de envelope.
    for (const key of ['result', 'analysis', 'food_analysis', 'data']) {
      if (parsed[key] && typeof parsed[key] === 'object' && !Array.isArray(parsed[key])) return parsed[key];
    }
    return parsed;
  }
  const detail = text ? ` Resposta recebida: ${text.replace(/\s+/g, ' ').slice(0, 180)}` : (thinking ? ' O modelo devolveu texto de raciocínio, mas não produziu o JSON final.' : ' O campo de resposta veio vazio.');
  throw new Error(`O Qwen respondeu, mas o RITMO não encontrou um objeto JSON válido.${detail}`);
}
function validateFoodAnalysis(parsed) {
  const sourceFoods = Array.isArray(parsed.foods) ? parsed.foods.slice(0,20) : [];
  const foods = sourceFoods.map(f => ({
    name:String(f.name || 'Alimento').slice(0,100),
    portionGrams:Math.max(1,Math.min(2000,Number(f.portion_grams)||100)),
    kcal:Math.max(0,Math.min(1000,Number(f.kcal_per_100g)||0)),
    protein:Math.max(0,Math.min(100,Number(f.protein_per_100g)||0)),
    carbs:Math.max(0,Math.min(100,Number(f.carbs_per_100g)||0)),
    fat:Math.max(0,Math.min(100,Number(f.fat_per_100g)||0)),
    fiber:Math.max(0,Math.min(100,Number(f.fiber_per_100g)||0)),
    confidence:['baixa','media','alta'].includes(f.confidence)?f.confidence:'baixa',
    note:String(f.note||'').slice(0,280)
  }));
  if (!foods.length) throw Object.assign(new Error('Não consegui identificar alimentos com confiança nesta fotografia. Tenta aproximar a câmara, melhorar a iluminação ou escolher outra imagem.'), {status:422});
  return {
    foods,
    totalKcalLow:Math.max(0,Number(parsed.total_kcal_low)||0),
    totalKcalHigh:Math.max(0,Number(parsed.total_kcal_high)||0),
    confidence:['baixa','media','alta'].includes(parsed.confidence)?parsed.confidence:'baixa',
    assumptions:String(parsed.assumptions||''),
    warning:'Estimativa visual aproximada. Uma fotografia não permite medir com rigor o peso, o óleo, os molhos ou ingredientes escondidos. Confirma as porções e corrige os valores antes de guardar.',
    model:OLLAMA_MODEL,
    provider:'Ollama local'
  };
}
async function analyzeFoodImage(input) {
  const health = await getOllamaHealth();
  if (!health.ollamaConnected) throw Object.assign(new Error('O Ollama não está a funcionar. Instala-o a partir de ollama.com/download, abre a aplicação Ollama e volta a tentar. O RITMO não utiliza uma API externa para esta análise.'), {status:503});
  if (!health.modelInstalled) throw Object.assign(new Error(`O Ollama está ligado, mas falta descarregar o modelo ${OLLAMA_MODEL}. Executa install-qwen3.5-4b.bat na pasta do RITMO ou usa o botão “Instalar modelo recomendado”.`), {status:409});
  const mime = String(input.mimeType||'').toLowerCase();
  if (!['image/jpeg','image/png','image/webp'].includes(mime)) throw Object.assign(new Error('Formato não suportado. Usa JPG, PNG ou WEBP.'), {status:415});
  const raw = String(input.imageBase64||'').replace(/^data:image\/(?:jpeg|png|webp);base64,/i,'');
  if (!raw || raw.length > 11_000_000 || !/^[A-Za-z0-9+/]+=*$/.test(raw)) throw Object.assign(new Error('Imagem inválida ou demasiado grande.'), {status:400});

  const prompt = `Analisa a fotografia da refeição. Responde APENAS com JSON válido, sem markdown, sem explicações e sem texto fora do objeto JSON.\n\nIdentifica separadamente todos os alimentos visíveis, incluindo acompanhamentos claramente identificáveis. Para cada alimento estima porção comestível em gramas e valores nutricionais por 100 g: kcal, proteína, hidratos, gordura e fibra. Não confundas o peso da porção com valores por 100 g. Usa números, nunca unidades dentro dos campos numéricos.\n\nSe não conseguires identificar comida, devolve foods como lista vazia. total_kcal_low e total_kcal_high são o intervalo estimado para a refeição inteira. Escreve nomes, notas e assumptions em português europeu. Sê prudente: não consegues medir com exatidão o peso, óleo, molhos ou ingredientes escondidos.\n\nO objeto tem obrigatoriamente esta estrutura: {"foods":[{"name":"...","portion_grams":150,"kcal_per_100g":120,"protein_per_100g":5,"carbs_per_100g":10,"fat_per_100g":4,"fiber_per_100g":2,"confidence":"media","note":"..."}],"total_kcal_low":100,"total_kcal_high":200,"confidence":"media","assumptions":"..."}. Os valores são apenas exemplo de estrutura, não os uses como resposta para a fotografia.`;

  async function requestAnalysis(format) {
    const body = {
      model:OLLAMA_MODEL,
      stream:false,
      think:false,
      keep_alive:'10m',
      format,
      options:{temperature:0, num_predict:1400},
      messages:[
        {role:'system',content:'És um analisador visual de alimentos. Tens de devolver exclusivamente um objeto JSON válido. Não incluas raciocínio, markdown ou texto adicional.'},
        {role:'user',content:prompt,images:[raw]}
      ]
    };
    const result = await ollamaFetch('/api/chat', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
    }, 240_000);
    const payload = await result.json().catch(()=>({}));
    if (!result.ok) {
      const message = payload.error || `Ollama respondeu com HTTP ${result.status}.`;
      if (/model.*not found|pull model/i.test(message)) throw Object.assign(new Error(`O modelo ${OLLAMA_MODEL} ainda não está instalado. Confirma com “ollama list”.`), {status:409});
      throw Object.assign(new Error(message), {status:502});
    }
    return {payload, parsed:parseModelJson(payload?.message?.content, payload?.message?.thinking)};
  }

  let parsed;
  try {
    // Primeiro pedido: esquema completo e modo sem raciocínio, para a resposta ser consumível pela app.
    const first = await requestAnalysis(foodSchema);
    parsed = first.parsed;
  } catch (firstError) {
    // Compatibilidade extra: alguns builds/modelos aceitam JSON mode melhor do que JSON Schema.
    // A imagem continua a ser enviada apenas ao Ollama local.
    if (firstError.status && firstError.status !== 502) throw firstError;
    try {
      const retryPrompt = `${prompt}\n\nÚltima instrução: gera agora o objeto JSON completo e válido. Não escrevas qualquer texto antes ou depois.`;
      const retryBody = {
        model:OLLAMA_MODEL, stream:false, think:false, keep_alive:'10m', format:'json',
        options:{temperature:0, num_predict:1400},
        messages:[
          {role:'system',content:'Responde apenas com um objeto JSON válido. Sem markdown, sem explicações e sem raciocínio visível.'},
          {role:'user',content:retryPrompt,images:[raw]}
        ]
      };
      const retryResponse = await ollamaFetch('/api/chat', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(retryBody)}, 240_000);
      const retryPayload = await retryResponse.json().catch(()=>({}));
      if (!retryResponse.ok) throw new Error(retryPayload.error || `Ollama respondeu com HTTP ${retryResponse.status}.`);
      parsed = parseModelJson(retryPayload?.message?.content, retryPayload?.message?.thinking);
    } catch (retryError) {
      console.warn('[RITMO] Falha a interpretar resposta do Qwen:', {model:OLLAMA_MODEL, first:firstError.message, retry:retryError.message});
      throw Object.assign(new Error(`O Qwen conseguiu receber a fotografia, mas não devolveu os dados nutricionais num formato válido. ${retryError.message || firstError.message} Atualiza o Ollama e tenta novamente com uma fotografia mais nítida.`), {status:422});
    }
  }
  return validateFoodAnalysis(parsed);
}

async function explainBibleVerse(input) {
  const health = await getOllamaHealth();
  if (!health.ollamaConnected) throw Object.assign(new Error('O Ollama não está ligado. Abre a aplicação Ollama e tenta novamente.'), {status:503});
  if (!health.modelInstalled) throw Object.assign(new Error(`O modelo ${OLLAMA_MODEL} não está instalado. Confirma com “ollama list”.`), {status:409});
  const reference = String(input.reference || '').trim().slice(0,120);
  const verse = String(input.verse || '').trim().slice(0,1600);
  const previous = String(input.previous || '').trim().slice(0,1200);
  const next = String(input.next || '').trim().slice(0,1200);
  if (!reference || !verse) throw Object.assign(new Error('Falta a referência ou o texto do versículo.'), {status:400});
  const prompt = `Explica o versículo bíblico indicado, em português europeu claro e acessível.\n\nREFERÊNCIA: ${reference}\nTEXTO DO VERSÍCULO: ${verse}\nVERSÍCULO ANTERIOR: ${previous || '(não fornecido)'}\nVERSÍCULO SEGUINTE: ${next || '(não fornecido)'}\n\nOrganiza a resposta nestas secções curtas:\nCONTEXTO: situa o versículo no parágrafo/capítulo e identifica quem fala e a quem, apenas quando o texto permite concluir isso.\nSENTIDO: explica a ideia central, frase a frase, e esclarece expressões ou palavras difíceis.\nPORQUE PODE SER DIFÍCIL: explica metáforas, costumes, género literário, contexto histórico ou questões teológicas relevantes, se forem realmente pertinentes.\nLEITURAS E CUIDADOS: quando existirem interpretações cristãs relevantes diferentes, apresenta-as de forma justa e diz o que o texto não permite afirmar com segurança. Não inventes consenso nem factos históricos.\nEM POUCAS PALAVRAS: resume o sentido do versículo em linguagem simples.\n\nRegras: não transformes poesia em afirmação literal sem explicar o género; não retires o versículo do contexto; distingue o texto bíblico da interpretação; não apresentes uma tradição denominacional como a única possível; não inventes detalhes. Se o versículo for direto e não tiver dificuldade especial, diz isso e explica-o brevemente. Evita uma aplicação moralista automática. Mantém a resposta entre 120 e 260 palavras.`;
  const response = await ollamaFetch('/api/chat', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      model:OLLAMA_MODEL,stream:false,think:false,keep_alive:'10m',
      options:{temperature:0.2,num_predict:800},
      messages:[
        {role:'system',content:'És um assistente de estudo bíblico cuidadoso. Explicas texto, contexto e interpretações sem reivindicar autoridade religiosa. Escreve em português europeu. Se não souberes, assume a incerteza.'},
        {role:'user',content:prompt}
      ]
    })
  }, 180_000);
  const payload = await response.json().catch(()=>({}));
  if (!response.ok) throw Object.assign(new Error(payload.error || `O Ollama respondeu com HTTP ${response.status}.`), {status:502});
  const explanation = String(payload?.message?.content || '').trim();
  if (!explanation) throw Object.assign(new Error('O modelo não devolveu uma explicação de texto. Tenta novamente.'), {status:502});
  return {ok:true,reference,explanation,model:OLLAMA_MODEL,provider:'Ollama local'};
}

async function handleApi(req, res, url) {
  if (req.method === 'POST' && url.pathname === '/api/bible/explain-verse') {
    if (!isLocalRequest(req)) return sendJson(res,403,{error:'As explicações bíblicas só aceitam pedidos desta aplicação local.'});
    try { return sendJson(res,200,await explainBibleVerse(await readJson(req, 16 * 1024))); }
    catch (error) { return sendJson(res,error.status||502,{error:error.message||'Não foi possível explicar este versículo.'}); }
  }
  if (req.method === 'POST' && url.pathname === '/api/assistant/chat') {
    if (!isLocalRequest(req)) return sendJson(res,403,{error:'O assistente local só aceita pedidos desta aplicação neste computador.'});
    try {
      const health = await getOllamaHealth();
      if (!health.ollamaConnected) return sendJson(res,503,{error:'O Ollama não está ligado. Abre o Ollama e tenta novamente.'});
      if (!health.modelInstalled) return sendJson(res,409,{error:`O modelo ${OLLAMA_MODEL} não está instalado. Confirma com “ollama list”.`});
      const input = await readJson(req, 256 * 1024);
      const question = String(input.message || '').trim();
      if (!question || question.length > 1800) return sendJson(res,400,{error:'Escreve uma pergunta até 1.800 caracteres.'});
      const contextText = JSON.stringify(input.context || {}).slice(0, 24000);
      const history = (Array.isArray(input.history) ? input.history : []).slice(-8).map(item => ({
        role: item?.role === 'assistant' ? 'assistant' : item?.role === 'user' ? 'user' : null,
        content: String(item?.content || '').slice(0, 1600)
      })).filter(item => item.role && item.content);
      const system = `És o RITMO AI, um assistente pessoal que funciona localmente no computador do utilizador. Responde em português europeu, com clareza, estrutura e pragmatismo. Analisa apenas os dados apresentados no contexto local; se faltarem dados, diz claramente. Distingue factos registados de estimativas. Nunca inventes valores, treinos, refeições ou progresso. Podes sugerir rotinas equilibradas, mas não dês diagnósticos médicos, não prescrevas dietas clínicas nem substituas um médico, nutricionista ou profissional de exercício. Em questões espirituais, ajuda a organizar leitura e reflexão sem afirmar medir a fé ou falar em nome de Deus. Não julgues o utilizador, não atribuas valor moral a métricas e não recomendes restrição alimentar extrema ou treino excessivo. O contexto seguinte é um resumo agregado dos registos escolhidos pelo utilizador; não foi enviado o diário integral, orações privadas ou fotografias.

RESUMO LOCAL DO RITMO (JSON):
${contextText}`;
      const messages = [{role:'system',content:system}, ...history, {role:'user',content:question}];
      const response = await ollamaFetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({model:OLLAMA_MODEL,stream:false,think:false,keep_alive:'10m',options:{temperature:0.25,num_predict:900},messages})
      }, 180_000);
      const payload = await response.json().catch(()=>({}));
      if (!response.ok) return sendJson(res,502,{error:payload.error || `O Ollama respondeu com HTTP ${response.status}.`});
      const reply = String(payload?.message?.content || '').trim();
      if (!reply) return sendJson(res,502,{error:'O modelo não devolveu uma resposta de texto. Tenta reformular a pergunta.'});
      return sendJson(res,200,{ok:true,reply,model:OLLAMA_MODEL,provider:'Ollama local'});
    } catch (error) {
      return sendJson(res,error.status||502,{error:error.message||'Não foi possível contactar o assistente local.'});
    }
  }
  if (req.method === 'GET' && url.pathname === '/api/health') {
    const status = await getOllamaHealth();
    return sendJson(res, 200, {ok:true,photoAiProvider:'ollama-local',photoAiConfigured:status.ollamaConnected&&status.modelInstalled,...status});
  }
  if (req.method === 'POST' && url.pathname === '/api/ollama/install-model') {
    if (!isLocalRequest(req)) return sendJson(res,403,{error:'A instalação só pode ser iniciada a partir desta aplicação local.'});
    const health = await getOllamaHealth();
    if (!health.ollamaConnected) return sendJson(res,503,{error:'O Ollama não está a funcionar. Instala-o e abre a aplicação Ollama antes de instalar o modelo.'});
    const response = await ollamaFetch('/api/pull',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:OLLAMA_MODEL,stream:false})},60*60*1000);
    const result = await response.json().catch(()=>({}));
    if (!response.ok || result.error) return sendJson(res,502,{error:result.error||`Não foi possível descarregar o modelo (HTTP ${response.status}).`});
    const updated = await getOllamaHealth();
    return sendJson(res,200,{ok:true,model:OLLAMA_MODEL,modelInstalled:updated.modelInstalled,message:updated.modelInstalled?'Modelo instalado. A análise local está pronta.':'O download terminou, mas o modelo ainda não aparece na lista. Fecha e abre novamente o Ollama.'});
  }
  if (req.method === 'GET' && url.pathname === '/api/food/search') {
    const query = (url.searchParams.get('q')||'').trim();
    if (query.length < 2) return sendJson(res,400,{error:'Escreve pelo menos duas letras ou um código de barras.'});
    try { return sendJson(res,200,await searchFoods(query)); }
    catch (error) { return sendJson(res,502,{query,error:error.message||'Não foi possível pesquisar na base de alimentos.'}); }
  }
  if (req.method === 'POST' && url.pathname === '/api/food/analyze-image') {
    if (!isLocalRequest(req)) return sendJson(res,403,{error:'A análise de fotografias só aceita pedidos desta aplicação local.'});
    try { return sendJson(res,200,await analyzeFoodImage(await readJson(req))); }
    catch (error) { return sendJson(res,error.status||502,{error:error.message||'Falha ao analisar a fotografia.'}); }
  }
  return sendJson(res,404,{error:'Endpoint não encontrado.'});
}

const server = http.createServer(async (req,res) => {
  const url = new URL(req.url,`http://${req.headers.host||`${HOST}:${PORT}`}`);
  if (url.pathname.startsWith('/api/')) {
    try { return await handleApi(req,res,url); }
    catch (error) { return sendJson(res,error.status||500,{error:error.message||'Erro interno do servidor.'}); }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res,405,{error:'Método não permitido.'});
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { return sendJson(res,400,{error:'Caminho inválido.'}); }
  if (pathname === '/') pathname = '/index.html';
  const file = path.resolve(ROOT,`.${pathname}`);
  const relative = path.relative(ROOT,file);
  if ((!file.startsWith(ROOT+path.sep)&&file!==path.join(ROOT,'index.html')) || relative.split(path.sep).some(part=>part.startsWith('.')||part==='server')) return sendJson(res,403,{error:'Acesso negado.'});
  fs.stat(file,(err,stats)=>{
    if (err||!stats.isFile()) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200,{'Content-Type':mimeTypes[path.extname(file).toLowerCase()]||'application/octet-stream','X-Content-Type-Options':'nosniff'});
    if (req.method==='HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
});
server.listen(PORT,HOST,()=>{
  console.log(`RITMO disponível em http://${HOST}:${PORT}`);
  console.log(`IA por fotografia: Ollama local · ${OLLAMA_MODEL}`);
  console.log('As fotografias são enviadas apenas para o Ollama neste computador (127.0.0.1:11434).');
});
