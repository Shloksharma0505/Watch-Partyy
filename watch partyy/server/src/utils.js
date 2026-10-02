import { AppError } from './errors.js';

const ID_RE = /^[\w-]{11}$/;

/** Accepts a raw 11-char id or any common YouTube URL. Returns the id or null. */
export function parseVideoId(input) {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (ID_RE.test(value)) return value;
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, '');
  let id = null;
  if (host === 'youtu.be') id = url.pathname.split('/')[1];
  else if (host === 'youtube.com' || host === 'music.youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else {
      const m = url.pathname.match(/^\/(embed|shorts|live|v)\/([\w-]{11})/);
      if (m) id = m[2];
    }
  }
  return id && ID_RE.test(id) ? id : null;
}

export function cleanName(name) {
  const value = typeof name === 'string' ? name.replace(/\s+/g, ' ').trim().slice(0, 24) : '';
  if (!value) throw new AppError('BAD_REQUEST', 'Enter a display name to continue.');
  return value;
}

export function cleanToken(token) {
  if (typeof token !== 'string' || !/^[\w-]{16,64}$/.test(token)) {
    throw new AppError('BAD_REQUEST', 'Invalid session token.');
  }
  return token;
}

const validTime = (t) => typeof t === 'number' && Number.isFinite(t) && t >= 0 && t < 60 * 60 * 24;

/**
 * Validates + normalises the payload of a playback action.
 * `trusted` = the sender is allowed to supply a client-side timestamp (host/moderator).
 * Requests from participants never carry a time for play/pause, because by the time
 * somebody approves them that time would be stale.
 */
export function normalizeAction(type, payload = {}, trusted = true) {
  switch (type) {
    case 'play':
    case 'pause':
      return trusted && validTime(payload.time) ? { time: payload.time } : {};
    case 'seek':
      if (!validTime(payload.time)) throw new AppError('BAD_REQUEST', 'Invalid seek time.');
      return { time: payload.time };
    case 'change_video': {
      const videoId = parseVideoId(payload.videoId ?? payload.url);
      if (!videoId) throw new AppError('BAD_REQUEST', "That doesn't look like a valid YouTube link.");
      return { videoId };
    }
    default:
      throw new AppError('BAD_REQUEST', 'Unknown action.');
  }
}
