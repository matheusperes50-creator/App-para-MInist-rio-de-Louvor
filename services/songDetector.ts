import { GoogleGenAI } from "@google/genai";

export interface DetectedSongInfo {
  key?: string;
  bpm?: number;
  title?: string;
  artist?: string;
  source: 'gemini' | 'title_regex' | 'catalog' | 'mixed';
  rawVideoTitle?: string;
}

// Popular praise & worship songs catalog for instant fallback and high-confidence matching
const KNOWN_WORSHIP_CATALOG: Array<{
  keywords: string[];
  title: string;
  artist: string;
  key: string;
  bpm: number;
}> = [
  { keywords: ['lugar secreto'], title: 'Lugar Secreto', artist: 'Gabriela Rocha', key: 'F#', bpm: 70 },
  { keywords: ['a casa e sua', 'a casa é sua'], title: 'A Casa É Sua', artist: 'Casa Worship', key: 'C', bpm: 68 },
  { keywords: ['ousado amor', 'reckless love'], title: 'Ousado Amor', artist: 'Isaias Saad', key: 'Bb', bpm: 68 },
  { keywords: ['bondade de deus', 'goodness of god'], title: 'Bondade de Deus', artist: 'Isaias Saad', key: 'G', bpm: 70 },
  { keywords: ['ruja o leao', 'ruja o leão'], title: 'Ruja o Leão', artist: 'Talita Catanzaro', key: 'Em', bpm: 74 },
  { keywords: ['me atraiu'], title: 'Me Atraiu', artist: 'Gabriela Rocha', key: 'E', bpm: 68 },
  { keywords: ['eu te vejo em tudo'], title: 'Eu Te Vejo Em Tudo', artist: 'Casa Worship', key: 'C', bpm: 72 },
  { keywords: ['todavia me alegrarei'], title: 'Todavia Me Alegrarei', artist: 'Samuel Messias', key: 'A', bpm: 68 },
  { keywords: ['raridade'], title: 'Raridade', artist: 'Anderson Freire', key: 'A', bpm: 70 },
  { keywords: ['pra onde eu iria'], title: 'Pra Onde Eu Iria', artist: 'Morada', key: 'A', bpm: 66 },
  { keywords: ['quero conhecer jesus'], title: 'Quero Conhecer Jesus', artist: 'Alessandro Vilas Boas', key: 'G', bpm: 68 },
  { keywords: ['e tudo sobre voce', 'é tudo sobre você'], title: 'É Tudo Sobre Você', artist: 'Morada', key: 'E', bpm: 70 },
  { keywords: ['so tu es santo', 'só tu és santo'], title: 'Só Tu És Santo', artist: 'Morada', key: 'C', bpm: 72 },
  { keywords: ['para que entre o rei'], title: 'Para Que Entre o Rei', artist: 'Morada', key: 'G', bpm: 68 },
  { keywords: ['vitorioso es', 'vitorioso és'], title: 'Vitorioso És', artist: 'Gabriel Guedes', key: 'D', bpm: 130 },
  { keywords: ['santo espirito', 'santo espírito', 'holy spirit'], title: 'Santo Espírito', artist: 'Laura Souguellis', key: 'D', bpm: 72 },
  { keywords: ['ninguem explica deus', 'ninguém explica deus'], title: 'Ninguém Explica Deus', artist: 'Preto no Branco', key: 'C', bpm: 66 },
  { keywords: ['alivio', 'alívio'], title: 'Alívio', artist: 'Jessé Aguiar', key: 'C', bpm: 70 },
  { keywords: ['algo novo'], title: 'Algo Novo', artist: 'Kemuel', key: 'C', bpm: 70 },
  { keywords: ['deus de promessas'], title: 'Deus de Promessas', artist: 'Davi Sacer', key: 'C', bpm: 68 },
  { keywords: ['grandes coisas'], title: 'Grandes Coisas', artist: 'Fernandinho', key: 'B', bpm: 110 },
  { keywords: ['galileu'], title: 'Galileu', artist: 'Fernandinho', key: 'B', bpm: 135 },
  { keywords: ['todas as coisas'], title: 'Todas as Coisas', artist: 'Fernandinho', key: 'G', bpm: 120 },
  { keywords: ['faz chover'], title: 'Faz Chover', artist: 'Fernandinho', key: 'A', bpm: 68 },
  { keywords: ['uma nova historia', 'uma nova história'], title: 'Uma Nova História', artist: 'Fernandinho', key: 'G', bpm: 118 },
  { keywords: ['me leva pra casa'], title: 'Me Leva Pra Casa', artist: 'Israel Subirá', key: 'G', bpm: 70 },
  { keywords: ['cancao do apocalipse', 'canção do apocalipse'], title: 'Canção do Apocalipse', artist: 'Ministério Avivah', key: 'G', bpm: 64 },
  { keywords: ['teu santo nome'], title: 'Teu Santo Nome', artist: 'Gabriela Rocha', key: 'Bb', bpm: 70 },
  { keywords: ['atos 2'], title: 'Atos 2', artist: 'Gabriela Rocha', key: 'F', bpm: 74 },
  { keywords: ['eu navegarei'], title: 'Eu Navegarei', artist: 'Gabriela Rocha', key: 'Am', bpm: 68 },
  { keywords: ['hosana', 'hosanna'], title: 'Hosana', artist: 'Gabriela Rocha', key: 'E', bpm: 76 },
  { keywords: ['em teus bracos', 'em teus braços'], title: 'Em Teus Braços', artist: 'Laura Souguellis', key: 'D', bpm: 70 },
  { keywords: ['aba'], title: 'Aba', artist: 'Laura Souguellis', key: 'G', bpm: 68 },
  { keywords: ['oceanos', 'oceans'], title: 'Oceanos', artist: 'Ana Nóbrega', key: 'D', bpm: 64 },
  { keywords: ['lindo es', 'lindo és'], title: 'Lindo És', artist: 'Juliano Son', key: 'A', bpm: 70 },
  { keywords: ['quando eu chorar'], title: 'Quando Eu Chorar', artist: 'Bruna Karla', key: 'C', bpm: 68 },
  { keywords: ['advogado fiel'], title: 'Advogado Fiel', artist: 'Bruna Karla', key: 'F', bpm: 66 },
  { keywords: ['sou humano'], title: 'Sou Humano', artist: 'Bruna Karla', key: 'G', bpm: 68 },
  { keywords: ['quebrantado coracao', 'quebrantado coração'], title: 'Quebrantado Coração', artist: 'Fernanda Brum', key: 'E', bpm: 64 },
  { keywords: ['espirito santo', 'espírito santo'], title: 'Espírito Santo', artist: 'Fernanda Brum', key: 'G', bpm: 65 },
  { keywords: ['hey pai', 'hey, pai'], title: 'Hey, Pai', artist: 'Isadora Pompeo', key: 'G', bpm: 72 },
  { keywords: ['minha morada'], title: 'Minha Morada', artist: 'Isadora Pompeo', key: 'F', bpm: 70 },
  { keywords: ['como nunca antes'], title: 'Como Nunca Antes', artist: 'Isadora Pompeo', key: 'G', bpm: 72 },
  { keywords: ['primeiro amor'], title: 'Primeiro Amor', artist: 'Arianne', key: 'G', bpm: 68 },
  { keywords: ['yahweh se manifestara', 'yahweh se manifestará'], title: 'Yahweh Se Manifestará', artist: 'Oasis Worship', key: 'Bb', bpm: 68 },
  { keywords: ['nao ha lugar mais alto', 'não há lugar mais alto'], title: 'Não Há Lugar Mais Alto', artist: 'Christine D\'Clario', key: 'A', bpm: 70 },
  { keywords: ['caminho no deserto', 'way maker'], title: 'Caminho no Deserto', artist: 'Soraya Moraes', key: 'C', bpm: 68 },
  { keywords: ['porque ele vive'], title: 'Porque Ele Vive', artist: 'Harpa Cristã', key: 'G', bpm: 72 },
  { keywords: ['escudo'], title: 'Escudo', artist: 'Voz da Verdade', key: 'G', bpm: 76 },
  { keywords: ['sua presenca e o meu prazer', 'sua presença é o meu prazer'], title: 'Sua Presença É o Meu Prazer', artist: 'Casa Worship', key: 'G', bpm: 68 },
  { keywords: ['vai valer a pena'], title: 'Vai Valer a Pena', artist: 'Juliano Son', key: 'C', bpm: 68 },
  { keywords: ['ele e exaltado', 'ele é exaltado'], title: 'Ele É Exaltado', artist: 'Adhemar de Campos', key: 'F', bpm: 90 },
  { keywords: ['grande e o senhor', 'grande é o senhor'], title: 'Grande É o Senhor', artist: 'Adhemar de Campos', key: 'A', bpm: 100 },
  { keywords: ['eu te louvarei meu bom jesus'], title: 'Eu Te Louvarei Meu Bom Jesus', artist: 'Ronaldo Bezerra', key: 'G', bpm: 110 },
  { keywords: ['te agradeco', 'te agradeço'], title: 'Te Agradeço', artist: 'Diante do Trono', key: 'E', bpm: 72 },
  { keywords: ['preciso de ti'], title: 'Preciso de Ti', artist: 'Diante do Trono', key: 'F', bpm: 66 },
  { keywords: ['aguas purificadoras', 'águas purificadoras'], title: 'Águas Purificadoras', artist: 'Diante do Trono', key: 'G', bpm: 68 },
  { keywords: ['nos bracos do pai', 'nos braços do pai'], title: 'Nos Braços do Pai', artist: 'Diante do Trono', key: 'D', bpm: 68 },
  { keywords: ['coracao igual ao teu', 'coração igual ao teu'], title: 'Coração Igual ao Teu', artist: 'Diante do Trono', key: 'E', bpm: 66 },
  { keywords: ['reina sobre mim'], title: 'Reina Sobre Mim', artist: 'Nivea Soares', key: 'D', bpm: 70 },
  { keywords: ['me esvaziar'], title: 'Me Esvaziar', artist: 'Nivea Soares', key: 'G', bpm: 68 },
  { keywords: ['teu reino'], title: 'Teu Reino', artist: 'Ministério Cristo Vivo', key: 'A', bpm: 74 },
  { keywords: ['deus cuida de mim'], title: 'Deus Cuida de Mim', artist: 'Kleber Lucas', key: 'G', bpm: 70 },
  { keywords: ['aos pes da cruz', 'aos pés da cruz'], title: 'Aos Pés da Cruz', artist: 'Kleber Lucas', key: 'D', bpm: 72 },
  { keywords: ['pode morar aqui'], title: 'Pode Morar Aqui', artist: 'Theo Rubia', key: 'C', bpm: 70 },
  { keywords: ['bencaos que nao tem fim', 'bençãos que não tem fim', 'counting my blessings'], title: 'Bençãos Que Não Tem Fim', artist: 'Isadora Pompeo', key: 'G', bpm: 74 },
  { keywords: ['deserto'], title: 'Deserto', artist: 'Maria Marçal', key: 'C', bpm: 68 },
  { keywords: ['acende outra vez'], title: 'Acende Outra Vez', artist: 'Jefferson e Suellen', key: 'G', bpm: 72 },
  { keywords: ['vem me buscar'], title: 'Vem Me Buscar', artist: 'Jefferson e Suellen', key: 'C', bpm: 70 },
  { keywords: ['alfa e omega', 'alfa e ômega'], title: 'Alfa e Ômega', artist: 'Marine Friesen', key: 'E', bpm: 70 },
  { keywords: ['so quero ver voce', 'só quero ver você'], title: 'Só Quero Ver Você', artist: 'FHOP Music', key: 'G', bpm: 68 },
  { keywords: ['tu es bom', 'tu és bom'], title: 'Tu És Bom', artist: 'Fred Arrais', key: 'E', bpm: 128 },
  { keywords: ['ele continua sendo bom'], title: 'Ele Continua Sendo Bom', artist: 'Paulo César Baruk', key: 'C', bpm: 70 }
];

export const extractYoutubeVideoId = (url?: string): string | null => {
  if (!url) return null;
  const clean = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = clean.match(regExp);
  return match ? match[1] : null;
};

// Clean channel author to remove suffix clutter like "Oficial", "Vevo", etc.
export const cleanChannelAuthor = (author?: string): string => {
  if (!author) return '';
  return author
    .replace(/\s*[-–]\s*(?:tópico|topic)\b/gi, '')
    .replace(/\s*(?:oficial|official|vevo|canal oficial|ministério faz chover)\b/gi, '')
    .replace(/["']/g, '')
    .trim();
};

// Fetch official YouTube title and channel name via public oEmbed
export const fetchYoutubeMetadata = async (url: string): Promise<{ title: string; author: string } | null> => {
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) return null;

  const endpoints = [
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
  ];

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const response = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.title) {
          return {
            title: data.title as string,
            author: (data.author_name as string) || ''
          };
        }
      }
    } catch {
      // Ignore network / CORS failure and try next
    }
  }

  return null;
};

// Clean and normalize musical tone / key
export const normalizeMusicalKey = (rawKey: string): string => {
  let clean = rawKey.trim();
  if (!clean) return '';

  // Extract letter + accidental + optional minor
  const match = clean.match(/([A-G][#b]?)(m|min|minor)?/i);
  if (!match) return clean.toUpperCase();

  let root = match[1].charAt(0).toUpperCase();
  if (match[1].length > 1) {
    const acc = match[1].charAt(1);
    root += acc === '#' ? '#' : 'b';
  }

  const isMinor = !!match[2];
  return isMinor ? `${root}m` : root;
};

// Try to extract Key and BPM directly from text (e.g. video title or description)
export const extractKeyAndBpmFromText = (text: string): { key?: string; bpm?: number } => {
  if (!text) return {};
  const result: { key?: string; bpm?: number } = {};

  // BPM extraction:
  const bpmMatch = text.match(/(?:bpm|andamento)\s*[:=–-]?\s*(\d{2,3})\b/i) ||
                   text.match(/\b(\d{2,3})\s*bpm\b/i);
  if (bpmMatch) {
    const val = parseInt(bpmMatch[1], 10);
    if (val >= 40 && val <= 240) {
      result.bpm = val;
    }
  }

  // Key extraction:
  const keyMatch = text.match(/(?:tom|tonalidade|key)\s*[:=–-]?\s*([A-G][#b]?(?:m|maj|min)?)\b/i) ||
                  text.match(/\b([A-G][#b]?(?:m)?)\s*(?:-|\||\/)\s*\d{2,3}\s*bpm\b/i) ||
                  text.match(/\b\d{2,3}\s*bpm\s*(?:-|\||\/)\s*([A-G][#b]?(?:m)?)\b/i);

  if (keyMatch) {
    result.key = normalizeMusicalKey(keyMatch[1]);
  }

  return result;
};

// Match against known praise catalog
export const matchKnownCatalog = (text: string): typeof KNOWN_WORSHIP_CATALOG[0] | null => {
  const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const item of KNOWN_WORSHIP_CATALOG) {
    for (const kw of item.keywords) {
      const normKw = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized.includes(normKw)) {
        return item;
      }
    }
  }
  return null;
};

// Clean video title to remove clutter like "(Ao Vivo)", "[Clipe Oficial]", "Lyric Video"
export const cleanVideoTitle = (rawTitle: string, authorName?: string): { title: string; artist: string } => {
  let cleaned = rawTitle
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^\)]*(?:ao vivo|live|clipe|oficial|lyric|audio|vídeo|video|playback|cover|legendado|acústico|acustico)[^\)]*\)/gi, ' ')
    .replace(/(?:ao vivo|live session|clipe oficial|vídeo oficial|video oficial|lyric video|playback|áudio oficial|audio oficial)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Try splitters: " - ", " | ", " // "
  let parts: string[] = [];
  if (cleaned.includes(' - ')) {
    parts = cleaned.split(' - ').map(p => p.trim()).filter(Boolean);
  } else if (cleaned.includes(' | ')) {
    parts = cleaned.split(' | ').map(p => p.trim()).filter(Boolean);
  } else if (cleaned.includes(' // ')) {
    parts = cleaned.split(' // ').map(p => p.trim()).filter(Boolean);
  }

  if (parts.length >= 2) {
    const part0 = parts[0];
    const part1 = parts[1];

    if (authorName) {
      const normAuthor = authorName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normPart0 = part0.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normPart1 = part1.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      if (normPart1.includes(normAuthor) || normAuthor.includes(normPart1)) {
        return { artist: part1, title: part0 };
      }
      if (normPart0.includes(normAuthor) || normAuthor.includes(normPart0)) {
        return { artist: part0, title: part1 };
      }
    }

    // Default convention: "Artist - Title"
    return {
      artist: part0,
      title: part1
    };
  }

  return { title: cleaned, artist: authorName || '' };
};

// Main function to detect Artist, Key and BPM from YouTube URL
export const detectSongKeyAndBpmFromYoutube = async (
  youtubeUrl: string,
  hints?: { currentTitle?: string; currentArtist?: string }
): Promise<DetectedSongInfo | null> => {
  const videoId = extractYoutubeVideoId(youtubeUrl);
  if (!videoId) return null;

  // Step 1: Fetch YouTube video title and author
  const meta = await fetchYoutubeMetadata(youtubeUrl);
  const videoTitle = meta?.title || '';
  const cleanAuthor = cleanChannelAuthor(meta?.author || '');

  const combinedSearchText = `${videoTitle} ${cleanAuthor} ${hints?.currentTitle || ''} ${hints?.currentArtist || ''}`.trim();

  // Step 2: Check for direct regex in video title (e.g. "Tom: G | 70 BPM")
  const regexResult = extractKeyAndBpmFromText(videoTitle);
  const catalogMatch = matchKnownCatalog(combinedSearchText);

  let detectedKey = regexResult.key || catalogMatch?.key;
  let detectedBpm = regexResult.bpm || catalogMatch?.bpm;
  let detectedTitle = catalogMatch?.title;
  let detectedArtist = catalogMatch?.artist;

  if (videoTitle) {
    const parsed = cleanVideoTitle(videoTitle, cleanAuthor);
    if (!detectedTitle && parsed.title) detectedTitle = parsed.title;
    if (!detectedArtist && parsed.artist) detectedArtist = parsed.artist;
  }

  if (!detectedArtist && cleanAuthor) {
    detectedArtist = cleanAuthor;
  }

  // Step 3: If Key, BPM or Artist are still missing, query Gemini AI
  const apiKey = (typeof process !== 'undefined' && (process.env?.API_KEY || (process.env as any)?.GEMINI_API_KEY)) || '';
  if ((!detectedKey || !detectedBpm || !detectedArtist) && apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Você é um músico profissional especializado em ministério de louvor e adoração cristã.
Analise este vídeo musical do YouTube:
- Link: "${youtubeUrl}"
- Título do vídeo no YouTube: "${videoTitle}"
- Canal do YouTube: "${cleanAuthor}"
- Título informado: "${hints?.currentTitle || ''}"
- Artista informado: "${hints?.currentArtist || ''}"

Identifique:
1. "key": Tom base da música gravada neste vídeo (notação musical padrão, ex: C, C#m, D, Eb, Em, F, F#m, G, Ab, A, Bbm, B).
2. "bpm": Andamento/BPM padrão da música (número inteiro aproximado, ex: 68, 70, 74, 120, etc.).
3. "title": Título limpo e oficial da música (sem "Ao Vivo", "Clipe Oficial", etc.).
4. "artist": Artista ou ministério original da música.

Retorne SOMENTE um JSON estrito no formato:
{"key": "G", "bpm": 70, "title": "Lugar Secreto", "artist": "Gabriela Rocha"}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text?.trim() || '';
      if (responseText) {
        try {
          const parsedAi = JSON.parse(responseText);
          if (parsedAi.key && !detectedKey) {
            detectedKey = normalizeMusicalKey(parsedAi.key);
          }
          if (parsedAi.bpm && !detectedBpm) {
            const num = parseInt(parsedAi.bpm, 10);
            if (num >= 40 && num <= 240) {
              detectedBpm = num;
            }
          }
          if (parsedAi.title && !detectedTitle) {
            detectedTitle = parsedAi.title;
          }
          if (parsedAi.artist && !detectedArtist) {
            detectedArtist = parsedAi.artist;
          }

          return {
            key: detectedKey,
            bpm: detectedBpm,
            title: detectedTitle,
            artist: detectedArtist,
            source: 'gemini',
            rawVideoTitle: videoTitle
          };
        } catch {
          // If JSON parse failed, continue with previous detections
        }
      }
    } catch (err) {
      console.warn('Gemini song detection error:', err);
    }
  }

  if (detectedKey || detectedBpm || detectedTitle || detectedArtist) {
    return {
      key: detectedKey,
      bpm: detectedBpm,
      title: detectedTitle,
      artist: detectedArtist,
      source: regexResult.key && regexResult.bpm ? 'title_regex' : catalogMatch ? 'catalog' : 'mixed',
      rawVideoTitle: videoTitle
    };
  }

  return null;
};
