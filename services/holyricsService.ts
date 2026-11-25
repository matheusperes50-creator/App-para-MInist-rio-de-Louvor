import { HolyricsConfig, HolyricsPresentation, HolyricsSong, Song } from '../types';

const HOLYRICS_CONFIG_STORAGE_KEY = 'louvor_holyrics_config';

export const DEFAULT_HOLYRICS_CONFIG: HolyricsConfig = {
  host: '',
  port: '8080',
  token: '',
  protocol: 'http',
  bridgeUrl: ''
};

export const loadHolyricsConfig = (): HolyricsConfig => {
  try {
    const raw = localStorage.getItem(HOLYRICS_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        host: typeof parsed.host === 'string' ? parsed.host : '',
        port: typeof parsed.port === 'string' ? parsed.port : '8080',
        token: typeof parsed.token === 'string' ? parsed.token : '',
        protocol: parsed.protocol === 'https' ? 'https' : 'http',
        bridgeUrl: typeof parsed.bridgeUrl === 'string' ? parsed.bridgeUrl : ''
      };
    }
  } catch {}
  return { ...DEFAULT_HOLYRICS_CONFIG };
};

export const saveHolyricsConfig = (config: HolyricsConfig): void => {
  try {
    localStorage.setItem(HOLYRICS_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Erro ao salvar configuração do Holyrics:', err);
  }
};

export const buildHolyricsBaseUrl = (config: HolyricsConfig): string => {
  let rawHost = (config.host || '').trim().replace(/\/+$/, '');
  if (!rawHost) return '';

  let protocol = config.protocol || 'http';
  if (/^https:\/\//i.test(rawHost)) {
    protocol = 'https';
    rawHost = rawHost.replace(/^https:\/\//i, '');
  } else if (/^http:\/\//i.test(rawHost)) {
    protocol = 'http';
    rawHost = rawHost.replace(/^http:\/\//i, '');
  }

  // Remove trailing path if accidentally pasted
  rawHost = rawHost.split('/')[0];

  const port = (config.port || '').trim();
  const hasPortInHost = /:\d+$/.test(rawHost);
  const hostWithPort = !hasPortInHost && port ? `${rawHost}:${port}` : rawHost;

  return `${protocol}://${hostWithPort}`;
};

export const getEffectiveRequestBaseUrl = (config: HolyricsConfig): string => {
  const bridge = (config.bridgeUrl || '').trim().replace(/\/+$/, '');
  if (bridge) {
    return /^https?:\/\//i.test(bridge) ? bridge : `http://${bridge}`;
  }
  return buildHolyricsBaseUrl(config);
};

export const isMixedContentRisk = (targetUrl: string): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.protocol === 'https:' && targetUrl.toLowerCase().startsWith('http://');
};

export type HolyricsErrorType =
  | 'config'
  | 'mixed_content'
  | 'cors'
  | 'auth'
  | 'timeout'
  | 'network'
  | 'api';

export interface HolyricsApiResult<T = any> {
  ok: boolean;
  data?: T;
  opaque?: boolean;
  latencyMs?: number;
  error?: string;
  errorType?: HolyricsErrorType;
}

interface CallOptions {
  allowNoCorsFallback?: boolean;
  timeoutMs?: number;
}

export async function callHolyricsApi<T = any>(
  config: HolyricsConfig,
  action: string,
  payload: Record<string, any> = {},
  options: CallOptions = {}
): Promise<HolyricsApiResult<T>> {
  const directTarget = buildHolyricsBaseUrl(config);
  const effectiveBase = getEffectiveRequestBaseUrl(config);
  const token = (config.token || '').trim();

  if (!directTarget && !effectiveBase) {
    return {
      ok: false,
      errorType: 'config',
      error: 'Informe o endereço IP do computador do Holyrics antes de conectar.'
    };
  }

  if (!token) {
    return {
      ok: false,
      errorType: 'config',
      error: 'Informe o Token de acesso gerado no Holyrics (API Server > Gerenciar Permissões).'
    };
  }

  if (isMixedContentRisk(effectiveBase)) {
    return {
      ok: false,
      errorType: 'mixed_content',
      error:
        'O aplicativo está aberto em HTTPS e o navegador bloqueou a conexão HTTP direta com o IP local da igreja. Libere "Conteúdo não seguro" nas permissões do site ou use uma URL HTTPS / Ponte Local.'
    };
  }

  const endpointUrl = `${effectiveBase}/api/${action}?token=${encodeURIComponent(token)}`;
  const bodyString = JSON.stringify(payload || {});
  const timeoutMs = options.timeoutMs ?? 6500;
  const startTime = performance.now();

  const tryFetch = async (headers: Record<string, string>, mode: RequestMode = 'cors') => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        mode,
        headers,
        body: bodyString,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timer);
    }
  };

  // Attempt 1: Standard application/json POST (works when bridge or CORS allows headers)
  try {
    const customHeaders: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (config.bridgeUrl && directTarget) {
      customHeaders['X-Holyrics-Target'] = directTarget;
    }

    const res = await tryFetch(customHeaders, 'cors');
    const latencyMs = Math.round(performance.now() - startTime);

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        latencyMs,
        errorType: 'auth',
        error: 'Token recusado ou sem permissão no Holyrics. Verifique as permissões do token em API Server.'
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        latencyMs,
        errorType: 'api',
        error: `Holyrics respondeu com erro HTTP ${res.status}.`
      };
    }

    const text = await res.text();
    if (!text) {
      return { ok: true, latencyMs };
    }

    const json = JSON.parse(text);
    if (json && json.status && json.status !== 'ok') {
      const msg = json.error || json.message || 'Erro retornado pelo Holyrics.';
      const isAuthErr = typeof msg === 'string' && /token|auth|permis|unauthorized/i.test(msg);
      return {
        ok: false,
        latencyMs,
        errorType: isAuthErr ? 'auth' : 'api',
        error: msg
      };
    }

    return {
      ok: true,
      latencyMs,
      data: (json && 'data' in json ? json.data : json) as T
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return {
        ok: false,
        errorType: 'timeout',
        error: `Tempo limite excedido ao tentar conectar em ${effectiveBase}. Verifique se o computador está ligado na mesma rede Wi-Fi e se o firewall permite a porta.`
      };
    }
  }

  // Attempt 2: text/plain POST (avoids CORS preflight OPTIONS when connecting directly)
  if (!config.bridgeUrl) {
    try {
      const res = await tryFetch({ 'Content-Type': 'text/plain;charset=utf-8' }, 'cors');
      const latencyMs = Math.round(performance.now() - startTime);

      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          latencyMs,
          errorType: 'auth',
          error: 'Token inválido ou sem permissão no Holyrics.'
        };
      }

      if (res.ok) {
        const text = await res.text();
        if (!text) return { ok: true, latencyMs };
        const json = JSON.parse(text);
        if (json && json.status && json.status !== 'ok') {
          return {
            ok: false,
            latencyMs,
            errorType: 'api',
            error: json.error || json.message || 'Erro retornado pelo Holyrics.'
          };
        }
        return {
          ok: true,
          latencyMs,
          data: (json && 'data' in json ? json.data : json) as T
        };
      }
    } catch {
      // Continue to optional no-cors fallback or diagnostic error
    }
  }

  // Attempt 3: For fire-and-forget commands (ShowLyrics, ActionNext, AddLyricsToPlaylist, SetAlert),
  // mode: 'no-cors' still delivers the command over LAN even if Holyrics omits Access-Control-Allow-Origin.
  if (options.allowNoCorsFallback && !config.bridgeUrl) {
    try {
      await tryFetch({ 'Content-Type': 'text/plain;charset=utf-8' }, 'no-cors');
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        ok: true,
        opaque: true,
        latencyMs
      };
    } catch {}
  }

  return {
    ok: false,
    errorType: 'cors',
    error:
      `Não foi possível ler a resposta de ${effectiveBase}. Verifique se o API Server está ativo no Holyrics e se o navegador permitiu acesso à rede local (ou use a Ponte Local para Windows).`
  };
}

export async function testHolyricsConnection(config: HolyricsConfig): Promise<HolyricsApiResult<any>> {
  const res = await callHolyricsApi(config, 'GetCPInfo', {});
  if (res.ok) return res;
  // Fallback to GetLyricsPlaylist if GetCPInfo is not permitted for the token
  if (res.errorType === 'api' || res.errorType === 'auth') {
    const playlistCheck = await callHolyricsApi(config, 'GetLyricsPlaylist', {});
    if (playlistCheck.ok) return playlistCheck;
  }
  return res;
}

export async function fetchHolyricsSongs(config: HolyricsConfig): Promise<HolyricsApiResult<HolyricsSong[]>> {
  const res = await callHolyricsApi<any>(config, 'GetSongs', {
    fields: 'id,title,artist,author,key,bpm'
  }, { timeoutMs: 12000 });

  if (!res.ok) return res;
  const list = Array.isArray(res.data) ? res.data : [];
  return {
    ...res,
    data: list.map((item: any) => ({
      id: String(item.id ?? ''),
      title: String(item.title ?? ''),
      artist: item.artist ? String(item.artist) : '',
      author: item.author ? String(item.author) : '',
      key: item.key ? String(item.key) : '',
      bpm: typeof item.bpm === 'number' && item.bpm > 0 ? Math.round(item.bpm) : undefined
    }))
  };
}

export async function fetchHolyricsPlaylist(config: HolyricsConfig): Promise<HolyricsApiResult<HolyricsSong[]>> {
  const res = await callHolyricsApi<any>(config, 'GetLyricsPlaylist', {});
  if (!res.ok) return res;
  const list = Array.isArray(res.data) ? res.data : [];
  return {
    ...res,
    data: list.map((item: any) => ({
      id: String(item.id ?? ''),
      title: String(item.title ?? ''),
      artist: item.artist ? String(item.artist) : '',
      author: item.author ? String(item.author) : '',
      key: item.key ? String(item.key) : '',
      bpm: typeof item.bpm === 'number' && item.bpm > 0 ? Math.round(item.bpm) : undefined
    }))
  };
}

export async function addSongsToHolyricsPlaylist(
  config: HolyricsConfig,
  ids: string[],
  index?: number
): Promise<HolyricsApiResult<any>> {
  const cleanIds = ids.map(id => String(id).trim()).filter(Boolean);
  if (cleanIds.length === 0) {
    return { ok: false, errorType: 'config', error: 'Nenhuma música selecionada para enviar.' };
  }
  const payload: Record<string, any> = { ids: cleanIds };
  if (typeof index === 'number') payload.index = index;
  return callHolyricsApi(config, 'AddLyricsToPlaylist', payload, { allowNoCorsFallback: true });
}

export async function removeSongFromHolyricsPlaylist(
  config: HolyricsConfig,
  params: { id?: string; ids?: string[]; index?: number }
): Promise<HolyricsApiResult<any>> {
  return callHolyricsApi(config, 'RemoveFromLyricsPlaylist', params, { allowNoCorsFallback: true });
}

export async function showHolyricsSong(
  config: HolyricsConfig,
  id: string,
  initialIndex = 0
): Promise<HolyricsApiResult<any>> {
  return callHolyricsApi(
    config,
    'ShowLyrics',
    { id: String(id), initial_index: initialIndex },
    { allowNoCorsFallback: true }
  );
}

export async function fetchCurrentPresentation(
  config: HolyricsConfig
): Promise<HolyricsApiResult<HolyricsPresentation | null>> {
  return callHolyricsApi<HolyricsPresentation | null>(config, 'GetCurrentPresentation', {
    include_slides: true,
    include_slide_comment: false
  });
}

export async function sendHolyricsActionNext(config: HolyricsConfig): Promise<HolyricsApiResult<any>> {
  return callHolyricsApi(config, 'ActionNext', {}, { allowNoCorsFallback: true });
}

export async function sendHolyricsActionPrevious(config: HolyricsConfig): Promise<HolyricsApiResult<any>> {
  return callHolyricsApi(config, 'ActionPrevious', {}, { allowNoCorsFallback: true });
}

export async function closeHolyricsPresentation(config: HolyricsConfig): Promise<HolyricsApiResult<any>> {
  return callHolyricsApi(config, 'CloseCurrentPresentation', {}, { allowNoCorsFallback: true });
}

export async function showNextPlaylistSong(config: HolyricsConfig): Promise<HolyricsApiResult<any>> {
  return callHolyricsApi(config, 'ShowNextSongPlaylist', {}, { allowNoCorsFallback: true });
}

export async function setHolyricsAlert(
  config: HolyricsConfig,
  text: string,
  show: boolean
): Promise<HolyricsApiResult<any>> {
  return callHolyricsApi(
    config,
    'SetAlert',
    { text, show, display_ahead: true },
    { allowNoCorsFallback: true }
  );
}

export async function showHolyricsVerse(
  config: HolyricsConfig,
  reference: string
): Promise<HolyricsApiResult<any>> {
  return callHolyricsApi(
    config,
    'ShowVerse',
    { input: { references: [reference.trim()] } },
    { allowNoCorsFallback: true }
  );
}

export const normalizeSongTitleForMatch = (value: string): string => {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const matchAppSongToHolyrics = (
  appSong: Song | undefined,
  holyricsSongs: HolyricsSong[],
  fallbackTitle?: string
): HolyricsSong | null => {
  if (!holyricsSongs || holyricsSongs.length === 0) return null;

  if (appSong?.holyricsId) {
    const byId = holyricsSongs.find(h => h.id === appSong.holyricsId);
    if (byId) return byId;
  }

  const targetTitle = normalizeSongTitleForMatch(appSong?.title || fallbackTitle || '');
  if (!targetTitle) return null;

  // 1. Exact normalized match
  const exact = holyricsSongs.find(h => normalizeSongTitleForMatch(h.title) === targetTitle);
  if (exact) return exact;

  // 2. Partial match (minimum 4 chars to avoid false positives)
  if (targetTitle.length >= 4) {
    const partial = holyricsSongs.find(h => {
      const candidate = normalizeSongTitleForMatch(h.title);
      return candidate.length >= 4 && (candidate.includes(targetTitle) || targetTitle.includes(candidate));
    });
    if (partial) return partial;
  }

  return null;
};

export const generateWindowsBridgeBatchScript = (config: HolyricsConfig): string => {
  const targetUrl = buildHolyricsBaseUrl(config) || 'http://127.0.0.1:8080';
  return `@echo off
title Ponte Local Holyrics - Louvor PIBJE
echo ========================================================
echo   PONTE LOCAL HOLYRICS (CORS) - MINISTERIO DE LOUVOR
echo ========================================================
echo Destino Holyrics: ${targetUrl}
echo Porta da Ponte Local: http://localhost:8787
echo.
echo Mantenha esta janela aberta durante o culto ou ensaio.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$target = '${targetUrl}';" ^
  "$listener = New-Object System.Net.HttpListener;" ^
  "$listener.Prefixes.Add('http://localhost:8787/');" ^
  "$listener.Start();" ^
  "Write-Host 'Ponte ativa em http://localhost:8787 -> ' $target -ForegroundColor Green;" ^
  "while ($listener.IsListening) {" ^
  "  $ctx = $listener.GetContext();" ^
  "  $req = $ctx.Request;" ^
  "  $res = $ctx.Response;" ^
  "  $res.Headers.Add('Access-Control-Allow-Origin', '*');" ^
  "  $res.Headers.Add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');" ^
  "  $res.Headers.Add('Access-Control-Allow-Headers', 'Content-Type, X-Holyrics-Target');" ^
  "  $res.Headers.Add('Access-Control-Allow-Private-Network', 'true');" ^
  "  if ($req.HttpMethod -eq 'OPTIONS') { $res.StatusCode = 204; $res.Close(); continue; }" ^
  "  try {" ^
  "    $override = $req.Headers['X-Holyrics-Target'];" ^
  "    $base = if ($override) { $override } else { $target };" ^
  "    $destUrl = $base + $req.RawUrl;" ^
  "    $reader = New-Object System.IO.StreamReader($req.InputStream, $req.ContentEncoding);" ^
  "    $body = $reader.ReadToEnd();" ^
  "    $webReq = [System.Net.HttpWebRequest]::Create($destUrl);" ^
  "    $webReq.Method = $req.HttpMethod;" ^
  "    $webReq.ContentType = 'application/json';" ^
  "    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body);" ^
  "    $webReq.ContentLength = $bytes.Length;" ^
  "    $stream = $webReq.GetRequestStream(); $stream.Write($bytes, 0, $bytes.Length); $stream.Close();" ^
  "    $webRes = $webReq.GetResponse();" ^
  "    $resReader = New-Object System.IO.StreamReader($webRes.GetResponseStream());" ^
  "    $outText = $resReader.ReadToEnd();" ^
  "    $outBytes = [System.Text.Encoding]::UTF8.GetBytes($outText);" ^
  "    $res.ContentType = 'application/json; charset=utf-8';" ^
  "    $res.StatusCode = [int]$webRes.StatusCode;" ^
  "    $res.OutputStream.Write($outBytes, 0, $outBytes.Length);" ^
  "  } catch {" ^
  "    $errJson = ('{\"status\":\"error\",\"error\":\"' + ($_.Exception.Message -replace '\"','''') + '\"}');" ^
  "    $errBytes = [System.Text.Encoding]::UTF8.GetBytes($errJson);" ^
  "    $res.ContentType = 'application/json; charset=utf-8';" ^
  "    $res.StatusCode = 502;" ^
  "    $res.OutputStream.Write($errBytes, 0, $errBytes.Length);" ^
  "  } finally { $res.Close(); }" ^
  "}"
pause
`;
};
