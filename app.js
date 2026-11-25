import { analyze, MAX_INPUT, VERSION } from './lib/engine.js';

const $ = s => document.querySelector(s);
const EXAMPLES = [
  'Quero desenvolver um e-commerce com pagamento por Pix',
  'Quero pesquisar vulnerabilidades em um programa de Bug Bounty',
  'Quero desenvolver um aplicativo Android',
  'Quero criar um agente de IA que responde clientes',
  'Quero corrigir os erros do meu site e melhorar a performance',
  'Quero fazer o deploy da minha API com Docker numa VPS',
];
let state = { local: '', ia: '', tab: 'local' };
$('#ver').textContent = VERSION;

const ex = $('#examples');
for (const t of EXAMPLES) {
  const b = Object.assign(document.createElement('button'), { className: 'chip', type: 'button', textContent: t });
  b.onclick = () => { $('#pedido').value = t; updateCount(); $('#pedido').focus(); };
  ex.append(b);
}
const pedidoEl = $('#pedido');
function updateCount() { $('#count').textContent = `${pedidoEl.value.length}/${MAX_INPUT}`; }
pedidoEl.addEventListener('input', updateCount);
pedidoEl.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') gerar(); });

// A IA só fica disponível se o servidor tiver um provedor configurado.
fetch('api/health').then(r => r.ok ? r.json() : null).then(h => {
  if (h?.ia?.ativa) { $('#useAI').disabled = false; $('#aiLabel').textContent = `Refinar com IA (${h.ia.modelo})`; }
}).catch(() => {});

function fill(el, items, render) { el.replaceChildren(...items.map(render)); }
function li(text) { return Object.assign(document.createElement('li'), { textContent: text }); }

function show(a) {
  $('#rObj').textContent = a.objetivo;
  $('#rMode').textContent = a.modo;
  fill($('#rSpec'), a.especialidades, t => Object.assign(document.createElement('span'), { textContent: t }));
  fill($('#rRefs'), a.normas, n => { const e = document.createElement('li'); const b = document.createElement('b'); b.textContent = n.nome; const s = document.createElement('span'); s.textContent = n.porque; e.append(b, s); return e; });
  fill($('#rDel'), a.entregaveis, li);
  fill($('#rVal'), a.validacao, li);
  state.local = a.prompt;
  const r = $('#result'); r.hidden = false; r.classList.remove('reveal'); void r.offsetWidth; r.classList.add('reveal');
}
function paintPrompt() {
  $('#rPrompt').textContent = state.tab === 'ia' && state.ia ? state.ia : state.local;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.t === state.tab));
}
document.querySelectorAll('.tab').forEach(t => t.onclick = () => { state.tab = t.dataset.t; paintPrompt(); });

async function gerar() {
  const err = $('#err'); err.hidden = true;
  let a;
  try { a = analyze(pedidoEl.value); } catch (e) { err.textContent = e.message; err.hidden = false; return; }
  state = { local: '', ia: '', tab: 'local' };
  show(a); $('#rSrc').textContent = 'motor local'; $('#tabs').hidden = true; $('#aiNote').hidden = true; paintPrompt();
  if (!$('#useAI').checked) { $('#result').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  const go = $('#go'); go.disabled = true; go.textContent = 'Refinando com IA…';
  try {
    const r = await fetch('api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pedido: pedidoEl.value, refinarComIA: true }) });
    const j = await r.json();
    if (j.ia?.usada) { state.ia = j.ia.texto; state.tab = 'ia'; $('#tabs').hidden = false; $('#rSrc').textContent = `refinado por IA (${j.ia.modelo})`; }
    else if (j.ia?.motivo) { $('#aiNote').textContent = `IA não usada: ${j.ia.motivo}.`; $('#aiNote').hidden = false; }
  } catch { $('#aiNote').textContent = 'Não foi possível falar com o servidor; mostrando o resultado do motor local.'; $('#aiNote').hidden = false; }
  finally { go.disabled = false; go.textContent = 'Gerar prompt'; paintPrompt(); }
}
$('#go').onclick = gerar;

$('#copy').onclick = async () => {
  try { await navigator.clipboard.writeText($('#rPrompt').textContent); $('#copy').textContent = 'Copiado ✓'; }
  catch { $('#copy').textContent = 'Selecione e copie'; }
  setTimeout(() => ($('#copy').textContent = 'Copiar'), 1800);
};
$('#dl').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([$('#rPrompt').textContent], { type: 'text/markdown' }));
  a.download = 'prompt-tecnico.md'; a.click(); URL.revokeObjectURL(a.href);
};
updateCount();
