import { analisar, contarPalavras } from './analisador.js';
import { extrair, ALERTAS } from './extrator.js';

const LIMITE_BYTES = 5 * 1024 * 1024;
const MIN_PALAVRAS_VAGA = 50;

const $ = id => document.getElementById(id);
const el = {
  form: $('formulario'), arquivo: $('arquivo'), soltar: $('soltar'), nomeArquivo: $('arquivo-nome'),
  abaArquivo: $('aba-arquivo'), abaTexto: $('aba-texto'), painelArquivo: $('painel-arquivo'), painelTexto: $('painel-texto'),
  cvTexto: $('cv-texto'), vaga: $('vaga'), contador: $('contador'), erro: $('erro'), status: $('status'),
  botao: $('analisar'), resultado: $('resultado'), nova: $('nova'),
};

let arquivoAtual = null;
let modo = 'arquivo';

// Abas: enviar arquivo ou colar texto.
function trocarAba(novo) {
  modo = novo;
  const arq = novo === 'arquivo';
  el.abaArquivo.setAttribute('aria-selected', arq);
  el.abaTexto.setAttribute('aria-selected', !arq);
  el.abaArquivo.tabIndex = arq ? 0 : -1;
  el.abaTexto.tabIndex = arq ? -1 : 0;
  el.painelArquivo.hidden = !arq;
  el.painelTexto.hidden = arq;
}
el.abaArquivo.addEventListener('click', () => trocarAba('arquivo'));
el.abaTexto.addEventListener('click', () => trocarAba('texto'));
for (const aba of [el.abaArquivo, el.abaTexto]) {
  aba.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const outra = aba === el.abaArquivo ? el.abaTexto : el.abaArquivo;
    trocarAba(outra === el.abaArquivo ? 'arquivo' : 'texto');
    outra.focus();
  });
}

// Seleção e arraste de arquivo.
function definirArquivo(f) {
  esconderErro();
  if (!f) return;
  if (!/\.(pdf|docx)$/i.test(f.name)) return mostrarErro('Formato não suportado. Envie um arquivo PDF ou DOCX.');
  if (f.size > LIMITE_BYTES) return mostrarErro('O arquivo tem mais de 5 MB. Reduza o tamanho ou cole o texto do currículo.');
  arquivoAtual = f;
  el.nomeArquivo.textContent = f.name;
  el.nomeArquivo.hidden = false;
}
el.arquivo.addEventListener('change', () => definirArquivo(el.arquivo.files[0]));
['dragenter', 'dragover'].forEach(ev => el.soltar.addEventListener(ev, e => { e.preventDefault(); el.soltar.classList.add('arrastando'); }));
['dragleave', 'drop'].forEach(ev => el.soltar.addEventListener(ev, e => { e.preventDefault(); el.soltar.classList.remove('arrastando'); }));
el.soltar.addEventListener('drop', e => definirArquivo(e.dataTransfer.files[0]));
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => e.preventDefault());

el.vaga.addEventListener('input', () => {
  const n = contarPalavras(el.vaga.value);
  el.contador.textContent = `${n} ${n === 1 ? 'palavra' : 'palavras'} · mínimo de ${MIN_PALAVRAS_VAGA}`;
  el.contador.classList.toggle('ok', n >= MIN_PALAVRAS_VAGA);
});

function mostrarErro(msg) { el.erro.textContent = msg; el.erro.hidden = false; }
function esconderErro() { el.erro.hidden = true; el.erro.textContent = ''; }

el.form.addEventListener('submit', async e => {
  e.preventDefault();
  esconderErro();

  const textoVaga = el.vaga.value.trim();
  if (modo === 'arquivo' && !arquivoAtual) return mostrarErro('Selecione o arquivo do currículo ou use a aba "Colar texto".');
  if (modo === 'texto' && contarPalavras(el.cvTexto.value) < 30) return mostrarErro('Cole o texto completo do currículo (pelo menos 30 palavras).');
  if (contarPalavras(textoVaga) < MIN_PALAVRAS_VAGA) return mostrarErro(`Cole a descrição completa da vaga, com pelo menos ${MIN_PALAVRAS_VAGA} palavras.`);

  el.botao.disabled = true;
  el.botao.textContent = 'Analisando…';
  try {
    let textoCV, alertas = [], origem = 'texto';
    if (modo === 'arquivo') {
      const r = await extrair(arquivoAtual, msg => { el.status.textContent = msg; });
      textoCV = r.texto;
      alertas = r.alertas;
      origem = r.tipo;
    } else {
      textoCV = el.cvTexto.value;
    }
    el.status.textContent = 'Comparando com a vaga…';
    const r = analisar(textoCV, textoVaga);
    mostrarResultado(r, alertas, origem);
    el.status.textContent = '';
  } catch (err) {
    console.error(err);
    el.status.textContent = '';
    mostrarErro(err.message || 'Não foi possível analisar o currículo.');
  } finally {
    el.botao.disabled = false;
    el.botao.textContent = 'Analisar currículo';
  }
});

function preencher(ul, itens, classe, vazio) {
  ul.replaceChildren();
  if (!itens.length) {
    const li = document.createElement('li');
    li.className = 'vazio';
    li.textContent = vazio;
    ul.append(li);
    return;
  }
  for (const i of itens) {
    const li = document.createElement('li');
    if (typeof i === 'string') { li.textContent = i; if (classe) li.className = classe; }
    else { li.textContent = i.texto; li.className = i.classe; }
    ul.append(li);
  }
}

function nivel(p) {
  if (p >= 75) return ['Alta aderência', '#2f6b4a'];
  if (p >= 50) return ['Aderência média', '#1f4e5f'];
  if (p >= 30) return ['Aderência baixa', '#8a5a14'];
  return ['Aderência muito baixa', '#9b2c2c'];
}

function mostrarResultado(r, alertas, origem) {
  const [rotulo, cor] = nivel(r.pontuacao);
  $('nota').textContent = r.pontuacao;
  $('nivel').textContent = rotulo;
  $('nivel').style.color = cor;
  $('medidor').setAttribute('aria-label', `Pontuação de aderência: ${r.pontuacao} de 100. ${rotulo}.`);
  const arco = $('arco');
  arco.style.stroke = cor;
  arco.style.strokeDashoffset = 326.7;
  requestAnimationFrame(() => requestAnimationFrame(() => { arco.style.strokeDashoffset = 326.7 * (1 - r.pontuacao / 100); }));

  preencher($('ausentes'), r.ausentes, '', 'Nenhum termo importante da vaga ficou de fora.');
  preencher($('presentes'), r.presentes, '', 'Nenhum dos termos principais da vaga apareceu no currículo.');

  const comp = lista => lista.map(s => ({ texto: s.nome + (s.noCV ? '' : ' (não encontrada no currículo)'), classe: s.noCV ? 'sim' : 'nao' }));
  preencher($('tecnicas'), comp(r.competencias.tecnicas), '', 'Nenhuma reconhecida na vaga.');
  preencher($('comportamentais'), comp(r.competencias.comportamentais), '', 'Nenhuma reconhecida na vaga.');

  const ulAlertas = $('alertas');
  ulAlertas.replaceChildren();
  const item = (titulo, texto, classe = '') => {
    const li = document.createElement('li');
    if (classe) li.className = classe;
    const s = document.createElement('strong');
    s.textContent = titulo;
    li.append(s, document.createTextNode(texto));
    ulAlertas.append(li);
  };
  if (origem === 'texto') {
    item('Formatação não avaliada', 'Com o texto colado não dá para verificar o layout. Envie o arquivo para checar colunas, tabelas e imagens.', 'info');
  } else if (!alertas.length) {
    item('Nenhum problema de formatação encontrado', `O ${origem} parece ter uma estrutura simples, fácil de ler por sistemas de triagem.`, 'ok');
  } else {
    for (const a of alertas) item(ALERTAS[a].titulo, ALERTAS[a].texto);
  }
  if (origem === 'DOCX') item('Cabeçalho e rodapé não verificados', 'Neste protótipo, o cabeçalho e o rodapé de arquivos DOCX ainda não são analisados. Evite colocar dados de contato neles.', 'info');

  preencher($('secoes'), r.secoes.map(s => ({ texto: s.nome + (s.encontrada ? '' : ' (não identificada)'), classe: s.encontrada ? 'sim' : 'nao' })), '', '');

  $('det-cobertura').textContent = `${Math.round(r.cobertura * 100)}% do peso coberto`;
  $('det-cosseno').textContent = `cosseno = ${r.cosseno.toFixed(2)}`;

  el.resultado.hidden = false;
  el.resultado.focus();
  el.resultado.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

// Exemplo para demonstração.
const EXEMPLO_CV = `Caio Waltrick
Pinhais, PR · caio@email.com · (41) 90000-0000

Resumo
Profissional de tecnologia da informação com experiência em suporte técnico, administração de servidores Windows e Active Directory.

Experiência
Analista de Suporte, SK Engenharia
Atendimento a usuários, administração do Active Directory, gerenciamento de estações de trabalho e chamados no GLPI. Administração do Microsoft 365 e Exchange Online.

Formação
Tecnologia em Gestão da Tecnologia da Informação, IFPR

Habilidades
Windows Server, Active Directory, Microsoft 365, GLPI, PowerShell, redes, comunicação, trabalho em equipe`;
const EXEMPLO_VAGA = `Analista de Infraestrutura de TI

Buscamos profissional para atuar na administração do ambiente de infraestrutura da empresa, dando suporte aos usuários e garantindo a disponibilidade dos serviços.

Atividades: administrar servidores Windows Server e Active Directory; gerenciar o Microsoft 365 e o Azure AD; automatizar rotinas com PowerShell; monitorar redes e backups; atender chamados de suporte técnico; documentar procedimentos.

Requisitos: experiência com Windows Server, Active Directory, Microsoft 365 e PowerShell; conhecimento em redes, virtualização e segurança da informação; boa comunicação e trabalho em equipe; proatividade.

Diferenciais: certificações Microsoft, conhecimento em Linux, Docker, ITIL e Zabbix.`;
$('exemplo').addEventListener('click', () => {
  trocarAba('texto');
  el.cvTexto.value = EXEMPLO_CV;
  el.vaga.value = EXEMPLO_VAGA;
  el.vaga.dispatchEvent(new Event('input'));
  esconderErro();
  el.botao.focus();
});

el.nova.addEventListener('click', () => {
  el.resultado.hidden = true;
  arquivoAtual = null;
  el.arquivo.value = '';
  el.nomeArquivo.hidden = true;
  el.cvTexto.value = '';
  el.vaga.value = '';
  el.vaga.dispatchEvent(new Event('input'));
  window.scrollTo({ top: 0 });
  (modo === 'arquivo' ? el.abaArquivo : el.abaTexto).focus();
});
