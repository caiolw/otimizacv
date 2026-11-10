// Extração de texto e detecção de problemas de formatação. Tudo roda no navegador.
import * as pdfjs from './vendor/pdf.min.mjs';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', import.meta.url).href;

const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
const MAX_PAGINAS_OCR = 3;

export const ALERTAS = {
  colunas: {
    titulo: 'Layout em colunas ou tabela',
    texto: 'O texto aparece lado a lado em várias linhas. Muitos sistemas de triagem leem da esquerda para a direita e acabam misturando as colunas. Prefira uma coluna só, com as seções uma embaixo da outra.',
  },
  tabela: {
    titulo: 'Tabela no documento',
    texto: 'Tabelas costumam ser lidas fora de ordem ou ignoradas pelos sistemas de triagem. Troque por texto corrido ou listas simples.',
  },
  imagem: {
    titulo: 'Imagens, ícones ou gráficos',
    texto: 'Sistemas de triagem não leem imagens. Se houver informação importante dentro de uma imagem (ícones de contato, barras de nível de idioma, logotipos), escreva-a como texto.',
  },
  cabecalho: {
    titulo: 'Conteúdo em cabeçalho ou rodapé',
    texto: 'Alguns sistemas ignoram o cabeçalho e o rodapé da página. Se seus dados de contato estiverem lá, coloque-os no corpo do documento.',
  },
  digitalizado: {
    titulo: 'PDF digitalizado (imagem)',
    texto: 'Este arquivo parece ser uma foto ou digitalização. O texto foi lido por reconhecimento óptico (OCR), que pode errar. Muitos sistemas de triagem nem fazem isso. Exporte o currículo direto do editor de texto como PDF.',
  },
  ocrParcial: {
    titulo: 'Leitura parcial',
    texto: `Só as primeiras ${MAX_PAGINAS_OCR} páginas foram lidas por OCR. O resultado pode não considerar todo o currículo.`,
  },
  pouco: {
    titulo: 'Pouco texto encontrado',
    texto: 'Foi possível ler pouco texto do arquivo. Confira se o currículo não está salvo como imagem ou com fontes incomuns.',
  },
};

export async function extrair(arquivo, aoProgredir = () => {}) {
  const nome = arquivo.name.toLowerCase();
  const buffer = await arquivo.arrayBuffer();
  if (nome.endsWith('.pdf') || arquivo.type === 'application/pdf') return extrairPDF(buffer, aoProgredir);
  if (nome.endsWith('.docx')) return extrairDOCX(buffer);
  throw new Error('Formato não suportado. Envie um arquivo PDF ou DOCX.');
}

async function extrairPDF(buffer, aoProgredir) {
  let doc;
  try {
    doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  } catch {
    throw new Error('Não foi possível abrir o PDF. O arquivo pode estar corrompido ou protegido por senha.');
  }
  const alertas = new Set();
  const paginas = [];
  let linhasTotais = 0, linhasComVao = 0;

  for (let n = 1; n <= doc.numPages; n++) {
    aoProgredir(`Lendo página ${n} de ${doc.numPages}…`);
    const pagina = await doc.getPage(n);
    const { width: largura, height: altura } = pagina.getViewport({ scale: 1 });
    const conteudo = await pagina.getTextContent();
    const itens = conteudo.items.filter(i => i.str && i.str.trim());

    // Agrupa itens por linha (mesma altura) para montar o texto e detectar colunas.
    const linhas = new Map();
    for (const i of itens) {
      const y = Math.round(i.transform[5] / 3) * 3;
      if (!linhas.has(y)) linhas.set(y, []);
      linhas.get(y).push({ x: i.transform[4], fim: i.transform[4] + (i.width || 0), s: i.str, y: i.transform[5] });
    }
    const ordenadas = [...linhas.entries()].sort((a, b) => b[0] - a[0]);
    const textoPagina = [];
    for (const [, ls] of ordenadas) {
      ls.sort((a, b) => a.x - b.x);
      let vao = false;
      for (let k = 1; k < ls.length; k++) if (ls[k].x - ls[k - 1].fim > largura * 0.12) vao = true;
      linhasTotais++;
      if (vao) linhasComVao++;
      textoPagina.push(ls.map(l => l.s).join(vao ? '   ' : ' '));
    }

    // Cabeçalho/rodapé: linha na faixa de 8% do topo ou da base, separada do corpo por um espaço grande.
    const ys = ordenadas.map(([y]) => y);
    if (ys.length > 1) {
      const topo = ys[0], base = ys[ys.length - 1];
      if (topo > altura * 0.92 && topo - ys[1] > 30) alertas.add('cabecalho');
      if (base < altura * 0.08 && ys[ys.length - 2] - base > 30) alertas.add('cabecalho');
    }

    const ops = await pagina.getOperatorList();
    const imagens = [pdfjs.OPS.paintImageXObject, pdfjs.OPS.paintInlineImageXObject, pdfjs.OPS.paintImageMaskXObject];
    if (ops.fnArray.some(f => imagens.includes(f))) alertas.add('imagem');

    paginas.push(textoPagina.join('\n'));
  }

  let texto = paginas.join('\n\n');
  if (linhasTotais >= 8 && linhasComVao / linhasTotais >= 0.25) alertas.add('colunas');

  // Pouco texto por página: provavelmente é uma digitalização.
  if (texto.replace(/\s/g, '').length < 80 * doc.numPages) {
    alertas.delete('imagem');
    alertas.delete('cabecalho');
    alertas.delete('colunas');
    alertas.add('digitalizado');
    texto = await ocr(doc, aoProgredir);
    if (doc.numPages > MAX_PAGINAS_OCR) alertas.add('ocrParcial');
  }
  if (texto.replace(/\s/g, '').length < 200) alertas.add('pouco');
  return { texto, alertas: [...alertas], tipo: 'PDF' };
}

async function extrairDOCX(buffer) {
  const mammoth = window.mammoth;
  let html, texto;
  try {
    ({ value: html } = await mammoth.convertToHtml({ arrayBuffer: buffer }));
    ({ value: texto } = await mammoth.extractRawText({ arrayBuffer: buffer }));
  } catch {
    throw new Error('Não foi possível abrir o DOCX. Confira se o arquivo não está corrompido.');
  }
  const alertas = [];
  if (/<table/i.test(html)) alertas.push('tabela');
  if (/<img/i.test(html)) alertas.push('imagem');
  if (texto.replace(/\s/g, '').length < 200) alertas.push('pouco');
  return { texto, alertas, tipo: 'DOCX' };
}

function carregarScript(url) {
  return new Promise((ok, erro) => {
    const s = document.createElement('script');
    s.src = url;
    s.onload = ok;
    s.onerror = () => erro(new Error('Não foi possível carregar o leitor de OCR. Verifique sua conexão.'));
    document.head.appendChild(s);
  });
}

async function ocr(doc, aoProgredir) {
  if (!window.Tesseract) {
    aoProgredir('Baixando o leitor de OCR (só na primeira vez)…');
    await carregarScript(TESSERACT_URL);
  }
  const worker = await window.Tesseract.createWorker('por');
  const partes = [];
  try {
    const total = Math.min(doc.numPages, MAX_PAGINAS_OCR);
    for (let n = 1; n <= total; n++) {
      aoProgredir(`Reconhecendo texto da página ${n} de ${total} (OCR)…`);
      const pagina = await doc.getPage(n);
      const viewport = pagina.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await pagina.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const { data } = await worker.recognize(canvas);
      partes.push(data.text);
      canvas.width = canvas.height = 0;
    }
  } finally {
    await worker.terminate();
  }
  return partes.join('\n\n');
}
