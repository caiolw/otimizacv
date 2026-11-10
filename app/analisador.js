// Análise léxica do currículo em relação à vaga. Funções puras, sem acesso ao DOM.

const STOPWORDS = new Set(`a ao aos aquela aquelas aquele aqueles aquilo as ate até com como da das de dela delas dele deles depois do dos e é ela elas ele eles em entre era essa essas esse esses esta está estas este estes eu foi for ha há isso isto ja já la lhe mais mas me mesmo meu minha muito na nas nem no nos nós nossa nosso num numa o os ou para pela pelas pelo pelos por qual quando que quem se sem ser seu seus sua suas tambem também te tem têm ter um uma umas uns voce você vocês sao são sobre ate cada bem bom boa sera será serão podem pode deve devem onde todo toda todos todas outro outra outros outras ainda alem além of the and to in for with on at by an or as is are be will you your our we`.split(/\s+/));

// Palavras frequentes em anúncios de vaga que não indicam competência.
const GENERICAS = new Set(`vaga vagas empresa empresas candidato candidata candidatos requisito requisitos desejavel desejaveis diferencial diferenciais atividade atividades responsabilidade responsabilidades beneficio beneficios oportunidade oportunidades area areas profissional profissionais buscamos procuramos time equipe nivel experiencia experiencias conhecimento conhecimentos sera atuar atuacao trabalho trabalhar local horario salario regime contratacao clt pj home office hibrido presencial remoto segunda sexta feira anos ano meses mes pleno plena junior senior estagio estagiario`.split(/\s+/));

export const SOFT_SKILLS = [
  'comunicação', 'trabalho em equipe', 'liderança', 'proatividade', 'organização',
  'resolução de problemas', 'pensamento crítico', 'criatividade', 'adaptabilidade',
  'flexibilidade', 'negociação', 'empatia', 'autonomia', 'responsabilidade',
  'gestão do tempo', 'atenção aos detalhes', 'relacionamento interpessoal', 'iniciativa',
];

export const HARD_SKILLS = [
  'excel', 'word', 'powerpoint', 'power bi', 'sql', 'python', 'java', 'javascript',
  'typescript', 'c#', 'c++', 'php', 'html', 'css', 'react', 'node.js', 'git', 'linux',
  'windows server', 'active directory', 'azure', 'aws', 'docker', 'kubernetes', 'sap',
  'totvs', 'autocad', 'scrum', 'kanban', 'itil', 'redes', 'office 365', 'microsoft 365',
  'tableau', 'figma', 'photoshop', 'inglês', 'espanhol', 'atendimento ao cliente',
  'vendas', 'marketing digital', 'contabilidade', 'logística', 'cnh',
];

const SECOES = [
  { nome: 'Dados de contato', teste: t => /@[a-z0-9-]+\.[a-z]/i.test(t) || /\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/.test(t) },
  { nome: 'Objetivo ou resumo', teste: t => /\b(objetivo|resumo profissional|resumo|perfil profissional|sobre mim)\b/.test(t) },
  { nome: 'Formação', teste: t => /\b(formacao|formacao academica|escolaridade|educacao)\b/.test(t) },
  { nome: 'Experiência', teste: t => /\b(experiencia profissional|experiencias profissionais|experiencia|historico profissional)\b/.test(t) },
  { nome: 'Competências', teste: t => /\b(competencias|habilidades|conhecimentos|skills)\b/.test(t) },
  { nome: 'Idiomas', teste: t => /\b(idiomas|idioma|linguas)\b/.test(t) },
];

export function semAcento(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Radicalização simples para o português: une plurais e variações comuns.
export function radical(p) {
  if (p.length <= 3 || /[#+.]/.test(p)) return p;
  if (p.endsWith('oes') || p.endsWith('aes')) return p.slice(0, -3) + 'ao';
  if (p.endsWith('ais')) return p.slice(0, -3) + 'al';
  if (p.endsWith('eis')) return p.slice(0, -3) + 'el';
  if (p.endsWith('res') || p.endsWith('zes') || p.endsWith('ses')) return p.slice(0, -2);
  if (p.endsWith('s') && !p.endsWith('ss')) return p.slice(0, -1);
  return p;
}

// Tokens em minúsculas, preservando acentos (para exibição).
function tokensOriginais(texto) {
  const brutos = texto.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}#+.]*/gu) || [];
  return brutos
    .map(t => t.replace(/\.+$/, ''))
    .filter(t => t.length > 1 || t === 'c' || t === 'r')
    .filter(t => !/^\d+$/.test(t));
}

export function tokens(texto) {
  return tokensOriginais(texto).map(semAcento);
}

function contagem(lista) {
  const m = new Map();
  for (const t of lista) m.set(t, (m.get(t) || 0) + 1);
  return m;
}

// Vetor de termos relevantes: radical -> { peso, forma mais comum no texto }.
function vetor(texto) {
  const formas = new Map();
  const termos = [];
  for (const original of tokensOriginais(texto)) {
    const t = semAcento(original);
    if (STOPWORDS.has(t) || GENERICAS.has(t)) continue;
    const r = radical(t);
    termos.push(r);
    if (!formas.has(r)) formas.set(r, new Map());
    const f = formas.get(r);
    f.set(original, (f.get(original) || 0) + 1);
  }
  const tf = contagem(termos);
  const pesos = new Map();
  for (const [r, n] of tf) pesos.set(r, 1 + Math.log(n)); // TF sublinear
  const forma = new Map();
  for (const [r, f] of formas) forma.set(r, [...f.entries()].sort((a, b) => b[1] - a[1])[0][0]);
  return { pesos, forma };
}

// Bigramas relevantes (ex.: "power bi", "gestão de projetos" vira "gestao projeto").
// Não atravessam pontuação, para não juntar itens de uma lista.
function bigramas(texto) {
  const contagemBi = new Map();
  const rotulos = new Map();
  for (const trecho of texto.split(/[,;:()\n\/|•·–—]|\.\s/)) {
    const lista = tokensOriginais(trecho);
    for (let i = 0; i < lista.length - 1; i++) {
      const a = semAcento(lista[i]), b = semAcento(lista[i + 1]);
      if (STOPWORDS.has(a) || STOPWORDS.has(b) || GENERICAS.has(a) || GENERICAS.has(b)) continue;
      const k = radical(a) + ' ' + radical(b);
      contagemBi.set(k, (contagemBi.get(k) || 0) + 1);
      if (!rotulos.has(k)) rotulos.set(k, lista[i] + ' ' + lista[i + 1]);
    }
  }
  return { contagem: contagemBi, rotulos };
}

export function cosseno(a, b) {
  let prod = 0, na = 0, nb = 0;
  for (const [k, v] of a) { na += v * v; if (b.has(k)) prod += v * b.get(k); }
  for (const v of b.values()) nb += v * v;
  return na && nb ? prod / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

function contem(textoNorm, termo) {
  const t = semAcento(termo).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${t}($|[^a-z0-9#+])`).test(textoNorm);
}

export function competencias(texto, lista) {
  const norm = semAcento(texto);
  return lista.filter(s => contem(norm, s));
}

export function secoes(texto) {
  const norm = semAcento(texto);
  return SECOES.map(s => ({ nome: s.nome, encontrada: s.teste(norm) }));
}

// Termos-chave da vaga: maiores pesos, com bigramas repetidos no topo.
function termosChave(textoVaga, limite = 25) {
  const { pesos, forma } = vetor(textoVaga);
  const { contagem: cb, rotulos } = bigramas(textoVaga);
  const bi = [...cb.entries()].filter(([, n]) => n >= 2).map(([k, n]) => ({ chave: k, peso: 1 + Math.log(n) + 0.5, rotulo: rotulos.get(k) }));
  const uni = [...pesos.entries()].map(([k, p]) => ({ chave: k, peso: p, rotulo: forma.get(k) }));
  // Palavras que já fazem parte de um bigrama-chave não aparecem sozinhas.
  const dentroDeBigrama = new Set(bi.flatMap(b => b.chave.split(' ')));
  const soltos = uni.filter(u => !dentroDeBigrama.has(u.chave));
  return [...bi, ...soltos].sort((a, b) => b.peso - a.peso).slice(0, limite);
}

export function analisar(textoCV, textoVaga) {
  const cv = vetor(textoCV);
  const vaga = vetor(textoVaga);
  const cvBi = bigramas(textoCV).contagem;

  const chaves = termosChave(textoVaga);
  let total = 0, cobertos = 0;
  const presentes = [], ausentes = [];
  for (const c of chaves) {
    const ok = c.chave.includes(' ') ? cvBi.has(c.chave) : cv.pesos.has(c.chave);
    total += c.peso;
    if (ok) { cobertos += c.peso; presentes.push(c.rotulo); } else ausentes.push(c.rotulo);
  }
  const cobertura = total ? cobertos / total : 0;
  const cos = cosseno(vaga.pesos, cv.pesos);

  // 70% cobertura ponderada dos termos-chave + 30% similaridade do cosseno.
  // O cosseno entre currículo e vaga raramente passa de 0,5, por isso é normalizado nesse teto.
  const pontuacao = Math.round(100 * (0.7 * cobertura + 0.3 * Math.min(cos / 0.5, 1)));

  const hardVaga = competencias(textoVaga, HARD_SKILLS);
  const softVaga = competencias(textoVaga, SOFT_SKILLS);
  const hardCV = new Set(competencias(textoCV, HARD_SKILLS));
  const softCV = new Set(competencias(textoCV, SOFT_SKILLS));

  return {
    pontuacao,
    cobertura,
    cosseno: cos,
    presentes,
    ausentes,
    secoes: secoes(textoCV),
    competencias: {
      tecnicas: hardVaga.map(s => ({ nome: s, noCV: hardCV.has(s) })),
      comportamentais: softVaga.map(s => ({ nome: s, noCV: softCV.has(s) })),
    },
  };
}

export function contarPalavras(texto) {
  return (texto.trim().match(/\S+/g) || []).length;
}
