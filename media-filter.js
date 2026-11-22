'use strict';

// Dedicated music apps and known music Web PWAs (checked before general browsers).
const MUSIC_APP_MARKERS = [
  'spotify',
  '_crx_pjibgcllelbfgfagdaldikeohf', // Spotify Web PWA (Chrome / Brave / Edge / Vivaldi / Arc)
  '_crx_cinhimbnkkaeohfgghhklpknlkffjgod', // YouTube Music PWA
  'youtubemusic',
  'ytmusic',
  'youtube-music',
  'pear-desktop',
  'applemusic',
  'appleinc.applemusic',
  'itunes',
  'tidal',
  'deezer',
  'amazonmusic',
  'amazon.music',
  'qobuz',
  'bandcamp',
  'cider',
  'soundcloud',
  'zunemusic',
  'windowsmediaplayer',
  'wmplayer',
  'foobar2000',
  'musicbee',
  'aimp',
  'winamp',
  'mediamonkey',
  'dopamine',
  'audacious',
  'clementine',
  'strawberry',
  'plexamp',
  'roon',
  'harmonoid',
];

// Social, short-form video, streaming video, and comms apps that should never drive a music player.
const BLOCKED_APP_MARKERS = [
  '_crx_akpamiohjfcnimfljfndmaldlcfphjmp', // Instagram PWA
  '_crx_agimnkijcaahngcdmfeangaknmldooml', // YouTube PWA
  'instagram',
  'tiktok',
  'facebook',
  'whatsapp',
  'telegram',
  'discord',
  'teams',
  'zoom',
  'slack',
  'skype',
  'netflix',
  'primevideo',
  'disneyplus',
  'hulu',
  'twitch',
  'zunevideo',
  'microsoft.windows.photos',
  'obs64',
  'obs32',
];

const BROWSER_MARKERS = [
  'chrome',
  'brave',
  'msedge',
  'firefox',
  '308046b0af4a39cb', // Firefox Windows AUMID
  'opera',
  'vivaldi',
  'thebrowser',
  'waterfox',
  'librewolf',
  'floorp',
  'thorium',
  'chromium',
  'yandex',
  'maxthon',
  'duckduckgo',
  '._crx_',
];

const BROWSER_TOKEN_RE = /(^|[.\\_\s-])(edge|arc|zen)($|[.\\_\s-])/i;

const BLOCKED_PLATFORMS = new Set([
  'instagram',
  'reel',
  'reels',
  'youtube',
  'youtube shorts',
  'short',
  'shorts',
  'tiktok',
  'facebook',
  'fb',
  'twitter',
  'x',
  'reddit',
  'twitch',
  'vimeo',
  'netflix',
  'threads',
  'snapchat',
  'pinterest',
  'linkedin',
  'whatsapp',
  'telegram',
  'discord',
]);

const GENERIC_TITLES = new Set([
  'video',
  'audio',
  'media',
  'untitled',
  'watch',
  'home',
  'explore',
  'feed',
  'shorts',
  'reels',
  'instagram',
  'tiktok',
  'youtube',
  'x',
]);

const DOMAIN_RE = /^(?:https?:\/\/|www\.|m\.)|^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|io|tv|co|me|app|gg|ly|be|fm|us|uk|de|fr|ca|au|in)(?:\/.*)?$/i;
const SHORT_HASHTAG_RE = /(?:^|\s)#(?:shorts?|reels?|tiktok|fyp|foryou(?:page)?|viral|trending|memes?|comedy|funny|explore|clips?)\b/i;
const SOCIAL_TITLE_RE = /^(?:\(\d+\)\s*)?(?:instagram|tiktok|reels|youtube(?:\s+shorts)?|facebook|reddit|twitch|twitter|x)$|\b(?:on\s+(?:instagram|tiktok|facebook|twitter|x|reddit)|instagram\s+reels?|youtube\s+shorts?)\b|\s[|\-\u2022]\s*(?:instagram|tiktok|reels|youtube(?:\s+shorts)?|facebook|reddit|twitch|twitter|x)\s*$|^(?:reel|video)\s+by\b/i;
const EXPLICIT_MUSIC_TAG_RE = /[[(]\s*(?:official\s+(?:music\s+video|audio|video|lyric\s+video|visualizer)|lyric\s+video|lyrics?|audio|visualizer|music\s+video|live\s+(?:session|performance))\s*[\])]/i;
const TOPIC_OR_VEVO_RE = /(?:\s-\s*topic|vevo)$/i;

function classifyApp(appId) {
  const id = String(appId || '').trim().toLowerCase();
  if (!id) return 'other';
  if (MUSIC_APP_MARKERS.some((m) => id.includes(m))) return 'music';
  if (BLOCKED_APP_MARKERS.some((m) => id.includes(m))) return 'blocked';
  if (BROWSER_MARKERS.some((m) => id.includes(m)) || BROWSER_TOKEN_RE.test(id)) return 'browser';
  return 'other';
}

function isDomainLike(str) {
  const s = String(str || '').trim();
  return Boolean(s && DOMAIN_RE.test(s));
}

function isBlockedPlatform(str) {
  const s = String(str || '')
    .trim()
    .replace(/^\(\d+\)\s*/, '')
    .toLowerCase();
  if (!s) return false;
  if (BLOCKED_PLATFORMS.has(s)) return true;
  if (/^(?:instagram|tiktok|youtube\s+shorts|facebook|reddit|twitch)\b(?:\s*[|\-\u2022]|$)/i.test(s)) return true;
  return false;
}

function hasRealAlbumField(session) {
  const album = String((session && session.album) || '').trim();
  return Boolean(album && !isDomainLike(album) && !isBlockedPlatform(album));
}

function isLikelyMusicSession(session, musicOnly = true) {
  if (!session) return false;
  const title = String(session.title || '').trim();
  const artist = String(session.artist || '').trim();
  if (!musicOnly) return Boolean(title || artist);
  if (!title && !artist) return false;

  const kind = classifyApp(session.app);
  if (kind === 'blocked') return false;
  if (kind === 'music') return true;

  const type = String(session.type || '').trim().toLowerCase();
  if (type === 'video') return false;

  const album = String(session.album || '').trim();
  const durMs = Number(session.durMs) || 0;

  if (!artist) return false;
  if (isDomainLike(artist) || isBlockedPlatform(artist)) return false;

  const strippedTitle = title.replace(/^\(\d+\)\s*/, '').trim().toLowerCase();
  if (GENERIC_TITLES.has(strippedTitle)) return false;
  if (SHORT_HASHTAG_RE.test(title) || SOCIAL_TITLE_RE.test(title)) return false;
  if (album && isBlockedPlatform(album)) return false;

  const realAlbum = hasRealAlbumField(session);

  if (kind === 'browser') {
    if (realAlbum) {
      return !(durMs > 0 && durMs < 25000);
    }
    const songLength = durMs >= 95000 && durMs <= 900000;
    const clearMusicSignal = TOPIC_OR_VEVO_RE.test(artist) || EXPLICIT_MUSIC_TAG_RE.test(title);
    return songLength && clearMusicSignal;
  }

  return realAlbum || (durMs >= 45000 && durMs <= 900000);
}

function sessionScore(session) {
  const kind = classifyApp(session.app);
  const realAlbum = hasRealAlbumField(session);
  return (
    (session.playing ? 100 : 0) +
    (kind === 'music' ? 20 : kind === 'other' ? 10 : 0) +
    (realAlbum ? 5 : 0) +
    (session.current ? 2 : 0)
  );
}

function pickBestSession(sessions, musicOnly = true) {
  if (!Array.isArray(sessions) || !sessions.length) return null;
  let best = null;
  let bestScore = -1;
  for (const s of sessions) {
    if (!isLikelyMusicSession(s, musicOnly)) continue;
    const score = sessionScore(s);
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best;
}

function cleanTitle(title) {
  return String(title || '')
    .replace(/\s*[([][^)\]]*[)\]]/g, '')
    .replace(/\s+-\s+.*$/, '')
    .replace(/\s+(?:feat\.?|ft\.?)\s+.*$/i, '')
    .trim();
}

function norm(str) {
  return String(str || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function tokenOverlap(a, b) {
  const ta = new Set(a.split(' ').filter(Boolean));
  const tb = new Set(b.split(' ').filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let hits = 0;
  for (const t of ta) if (tb.has(t)) hits++;
  return hits / Math.max(ta.size, tb.size);
}

function titlesMatch(want, cand) {
  const pairs = [
    [norm(want), norm(cand)],
    [norm(cleanTitle(want)), norm(cleanTitle(cand))],
    [norm(cleanTitle(want)), norm(cand)],
    [norm(want), norm(cleanTitle(cand))],
  ];
  for (const [a, b] of pairs) {
    if (!a || !b) continue;
    if (a === b) return true;
    if (Math.min(a.length, b.length) >= 4 && (a.includes(b) || b.includes(a))) return true;
    if (tokenOverlap(a, b) >= 0.65) return true;
  }
  return false;
}

function splitArtists(str) {
  const base = String(str || '').replace(/\s-\s*Topic$/i, '').trim();
  const parts = base
    .split(/\s*(?:,|&|;|\/|\bfeat\.?\b|\bft\.?\b|\bx\b)\s*/i)
    .map((x) => norm(x))
    .filter(Boolean);
  const full = norm(base);
  if (full && !parts.includes(full)) parts.unshift(full);
  return parts;
}

function artistsMatch(want, cand) {
  const wParts = splitArtists(want);
  const cParts = splitArtists(cand);
  const cFull = norm(String(cand || '').replace(/\s-\s*Topic$/i, ''));
  if (!wParts.length || !cFull) return false;
  for (const wp of wParts) {
    if (wp === cFull || cParts.includes(wp)) return true;
    if (wp.length >= 4 && cFull.length >= 4 && (cFull.includes(wp) || wp.includes(cFull))) return true;
    if (tokenOverlap(wp, cFull) >= 0.5) return true;
  }
  return false;
}

function durationDeltaSec(durMs, candidateSec) {
  if (!(durMs > 0) || !(candidateSec > 0)) return null;
  return Math.abs(candidateSec - durMs / 1000);
}

function pickBestLyricMatch(track, list) {
  if (!track || !track.title || !track.artist || !Array.isArray(list)) return null;
  const durMs = Number(track.durMs) || 0;
  const trackSec = durMs / 1000;
  const maxTol = durMs > 0 ? Math.max(15, Math.min(25, trackSec * 0.12)) : Infinity;

  let best = null;
  let bestDelta = Infinity;
  for (const item of list) {
    if (!item || !item.syncedLyrics) continue;
    if (!titlesMatch(track.title, item.trackName)) continue;
    if (!artistsMatch(track.artist, item.artistName)) continue;
    const delta = durationDeltaSec(durMs, Number(item.duration));
    if (delta !== null && delta > maxTol) continue;
    const scoreDelta = delta === null ? 999 : delta;
    if (!best || scoreDelta < bestDelta) {
      best = item;
      bestDelta = scoreDelta;
    }
  }
  return best;
}

function pickBestItunesArt(track, results) {
  if (!track || !track.title || !track.artist || !Array.isArray(results)) return null;
  const durMs = Number(track.durMs) || 0;
  let best = null;
  let bestDelta = Infinity;
  for (const r of results) {
    if (!r || !r.artworkUrl100) continue;
    if (!titlesMatch(track.title, r.trackName)) continue;
    if (!artistsMatch(track.artist, r.artistName)) continue;
    const candSec = Number(r.trackTimeMillis) > 0 ? Number(r.trackTimeMillis) / 1000 : 0;
    const delta = durationDeltaSec(durMs, candSec);
    if (delta !== null && delta > 25) continue;
    const scoreDelta = delta === null ? 999 : delta;
    if (!best || scoreDelta < bestDelta) {
      best = r.artworkUrl100;
      bestDelta = scoreDelta;
    }
  }
  return best;
}

module.exports = {
  classifyApp,
  isLikelyMusicSession,
  pickBestSession,
  cleanTitle,
  norm,
  titlesMatch,
  artistsMatch,
  pickBestLyricMatch,
  pickBestItunesArt,
};
