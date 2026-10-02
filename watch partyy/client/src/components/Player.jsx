import { useCallback, useEffect, useRef, useState } from 'react';
import { loadYT, parseVideoId, fmtTime } from '../lib/youtube.js';

const Play = () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>);
const Pause = () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg>);

/**
 * Wraps the YouTube IFrame player.
 * - The iframe has controls disabled and a transparent overlay on top, so nobody can change playback
 *   by clicking the video itself. Every change goes through the buttons below -> server -> everyone.
 * - `sync` (from the server) is the single source of truth; `apply()` nudges the player towards it.
 */
export default function Player({ sync, canControl, onAction, children }) {
  const mount = useRef(null);
  const player = useRef(null);
  const ready = useRef(false);
  const desired = useRef(null);
  const receivedAt = useRef(0);
  const loaded = useRef(null);
  const pauseAfterLoad = useRef(false);
  const lastVideo = useRef(null);

  const [now, setNow] = useState({ t: 0, d: 0 });
  const [scrub, setScrub] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [embedError, setEmbedError] = useState('');
  const [url, setUrl] = useState('');
  const [urlErr, setUrlErr] = useState('');

  const apply = useCallback(() => {
    const p = player.current;
    const s = desired.current;
    if (!p || !ready.current || !s) return;

    const elapsed = (Date.now() - receivedAt.current) / 1000;
    const target = s.playState === 'playing' ? s.currentTime + elapsed : s.currentTime;

    if (loaded.current !== s.videoId) {
      loaded.current = s.videoId;
      pauseAfterLoad.current = s.playState === 'paused';
      p.loadVideoById({ videoId: s.videoId, startSeconds: target });
      return;
    }
    const tolerance = s.reason === 'heartbeat' ? 2 : 0.7;
    const cur = p.getCurrentTime?.() ?? 0;
    const st = p.getPlayerState?.();
    if (Math.abs(cur - target) > tolerance) p.seekTo(target, true);
    if (s.playState === 'playing') {
      if (st !== 1 && st !== 3) p.playVideo();
    } else if (st === 1 || st === 3) {
      p.pauseVideo();
    }
  }, []);

  useEffect(() => {
    let dead = false;
    loadYT().then((YT) => {
      if (dead || !mount.current) return;
      player.current = new YT.Player(mount.current, {
        width: '100%',
        height: '100%',
        playerVars: { controls: 0, disablekb: 1, fs: 0, rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3 },
        events: {
          onReady: () => { ready.current = true; apply(); },
          onStateChange: (e) => {
            if (e.data === 1) {
              setBlocked(false);
              if (pauseAfterLoad.current) {
                pauseAfterLoad.current = false;
                player.current.pauseVideo();
              }
            }
          },
          onError: (e) =>
            setEmbedError(
              [101, 150].includes(e.data)
                ? "The owner of this video doesn't allow embedding. Pick another one."
                : "This video can't be played. Pick another one.",
            ),
        },
      });
    });
    const tick = setInterval(() => {
      const p = player.current;
      if (ready.current && p?.getCurrentTime) setNow({ t: p.getCurrentTime(), d: p.getDuration() || 0 });
    }, 400);
    return () => {
      dead = true;
      clearInterval(tick);
      try { player.current?.destroy(); } catch { /* already gone */ }
      player.current = null;
      ready.current = false;
    };
  }, [apply]);

  useEffect(() => {
    if (!sync) return;
    desired.current = sync;
    receivedAt.current = Date.now();
    if (lastVideo.current !== sync.videoId) {
      lastVideo.current = sync.videoId;
      setEmbedError('');
    }
    apply();
    setBlocked(false);
    if (sync.playState !== 'playing') return;
    const id = setTimeout(() => {
      const st = player.current?.getPlayerState?.();
      if (ready.current && desired.current?.playState === 'playing' && st !== 1 && st !== 3) setBlocked(true);
    }, 2200);
    return () => clearTimeout(id);
  }, [sync, apply]);

  const playing = sync?.playState === 'playing';
  const max = now.d || 1;
  const value = scrub ?? Math.min(now.t, max);

  const commitSeek = () => {
    if (scrub == null) return;
    onAction('seek', { time: scrub });
    setTimeout(() => setScrub(null), 1200);
  };
  const jump = (delta) => onAction('seek', { time: Math.max(0, Math.min(max, now.t + delta)) });

  const submitUrl = (e) => {
    e.preventDefault();
    const videoId = parseVideoId(url);
    if (!videoId) return setUrlErr("That doesn't look like a YouTube link.");
    setUrlErr('');
    setUrl('');
    onAction('change_video', { videoId });
  };

  return (
    <div className="player-wrap">
      <div className="screen">
        <div className="yt"><div ref={mount} /></div>
        <div className="shield" />
        {embedError && <div className="screen-msg">{embedError}</div>}
        {blocked && !embedError && (
          <button
            className="screen-msg click"
            onClick={() => {
              setBlocked(false);
              apply();
              player.current?.playVideo?.();
            }}
          >
            Your browser paused autoplay. Click to join playback.
          </button>
        )}
        {children}
      </div>

      <div className="controls">
        <button className="round" onClick={() => onAction(playing ? 'pause' : 'play', { time: now.t })} aria-label={playing ? (canControl ? 'Pause' : 'Ask to pause') : (canControl ? 'Play' : 'Ask to play')}>
          {playing ? <Pause /> : <Play />}
        </button>
        <button className="ghost" onClick={() => jump(-10)}>−10s</button>
        <input
          type="range"
          className="scrubber"
          min={0}
          max={max}
          step={0.5}
          value={value}
          aria-label="Seek"
          onChange={(e) => setScrub(Number(e.target.value))}
          onPointerUp={commitSeek}
          onKeyUp={commitSeek}
        />
        <button className="ghost" onClick={() => jump(10)}>+10s</button>
        <span className="time">{fmtTime(value)} / {fmtTime(now.d)}</span>
      </div>

      <form className="url-row" onSubmit={submitUrl}>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a YouTube link" aria-label="YouTube link" />
        <button type="submit" className={canControl ? 'primary' : ''}>{canControl ? 'Change video' : 'Request change'}</button>
      </form>
      {urlErr && <p className="form-error">{urlErr}</p>}
      {!canControl && (
        <p className="hint">
          You're watching as a guest. Play, pause, seek and video changes are sent to the host and moderators for approval.
        </p>
      )}
    </div>
  );
}
