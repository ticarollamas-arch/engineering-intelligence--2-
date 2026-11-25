import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, normalize, detectSignals, MAX_INPUT } from '../lib/engine.js';

const names = a => a.normas.map(n => n.nome).join(' | ');

test('e-commerce ativa LGPD, PCI e OWASP ASVS', () => {
  const a = analyze('Quero desenvolver um e-commerce');
  assert.equal(a.mode, 'desenvolvimento');
  for (const n of ['LGPD', 'PCI DSS', 'OWASP ASVS', 'NIST SSDF']) assert.match(names(a), new RegExp(n));
  assert.ok(a.especialidades.includes('Pagamentos'));
});

test('bug bounty entra em modo pesquisa com WSTG e CVSS, sem SLSA', () => {
  const a = analyze('Quero pesquisar vulnerabilidades em um programa de Bug Bounty');
  assert.equal(a.mode, 'pesquisa');
  assert.match(names(a), /WSTG/);
  assert.match(names(a), /CVSS/);
  assert.doesNotMatch(names(a), /SLSA/);
  assert.match(a.prompt, /escopo/);
});

test('aplicativo Android ativa OWASP MASVS', () => {
  const a = analyze('Quero desenvolver um aplicativo Android');
  assert.ok(a.especialidades.includes('Desenvolvimento mobile'));
  assert.match(names(a), /MASVS/);
});

test('melhoria de projeto existente usa SAMM e exige não regressão', () => {
  const a = analyze('quero corrigir os erros do meu site');
  assert.equal(a.mode, 'melhoria');
  assert.match(names(a), /SAMM/);
  assert.match(a.prompt, /regress/);
});

test('"ia" não é detectado dentro de outras palavras', () => {
  assert.equal(detectSignals('calcular a média diária').ai, false);
  assert.equal(detectSignals('quero um agente de IA').ai, true);
});

test('normalize remove acentos e caixa', () => {
  assert.equal(normalize('  Inteligência   ARTIFICIAL '), 'inteligencia artificial');
});

test('prompt tem as 19 seções na ordem', () => {
  const a = analyze('Quero criar uma API para agendamento de consultas');
  const secs = a.prompt.split('\n').filter(l => l.startsWith('## ')).map(l => Number(l.slice(3).split('.')[0]));
  assert.deepEqual(secs, Array.from({ length: 19 }, (_, i) => i + 1));
});

test('rejeita pedido vazio e corta pedido longo', () => {
  assert.throws(() => analyze('  '), /pelo menos/);
  assert.equal(analyze('site '.repeat(1000)).pedido.length, MAX_INPUT);
});
