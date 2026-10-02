import { useEffect, useState } from 'react';
import { useWatchParty } from '../hooks.js';
import Player from './Player.jsx';
import People from './People.jsx';
import Requests from './Requests.jsx';
import Chat from './Chat.jsx';

const EMOJIS = ['🎉', '😂', '😮', '❤️', '👏', '🔥'];

export default function Room({ session, onExit }) {
  const wp = useWatchParty(session, onExit);
  const [tab, setTab] = useState('people');

  useEffect(() => {
    if (wp.status === 'ready' && wp.roomId) {
      window.history.replaceState(
        {},
        '',
        `/room/${wp.roomId}`
      );
    }
  }, [wp.status, wp.roomId]);

  if (wp.status === 'connecting') {
    return (
      <div className="splash splash-new">
        <div className="splash-loader">
          <span />
          <span />
          <span />
        </div>

        <h2>Taking your seat...</h2>
        <p>Connecting you to the watch party</p>
      </div>
    );
  }

  if (wp.status === 'error') {
    return (
      <div className="splash splash-new">

        <div className="splash-error-icon">
          !
        </div>

        <h2>Something went wrong</h2>

        <p>{wp.error}</p>

        <button
          className="primary"
          onClick={() => onExit('')}
        >
          Back to home
        </button>

      </div>
    );
  }

  const { me, canControl, act } = wp;

  const link =
    `${window.location.origin}/room/${wp.roomId}`;

  const onAction = (type, payload) => {
    if (canControl) {
      return act(type, payload);
    }

    act('request_action', {
      action: type,
      payload:
        type === 'play' || type === 'pause'
          ? {}
          : payload,
    });

    wp.toast(
      'Request sent. Waiting for the host or a moderator.'
    );
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);

      wp.toast(
        'Invite link copied to clipboard',
        'ok'
      );
    } catch {
      window.prompt(
        'Copy this link',
        link
      );
    }
  };

  const switchTab = (nextTab) => {
    setTab(nextTab);
  };

  return (
    <div className="room room-new">

      {/* =====================================================
          TOP NAVIGATION
      ===================================================== */}

      <header className="topbar topbar-new">

        <div className="room-brand">
          <div className="brand-mark">
            ▶
          </div>

          <div className="brand-text">
            <strong>Watch Party</strong>
            <small>Watch together</small>
          </div>
        </div>


        <div className="room-meta">

          <div className="room-code-display">
            <small>ROOM</small>
            <strong>#{wp.roomId}</strong>
          </div>

          <div className="sync-pill">
            <span />
            Live sync
          </div>

          {wp.status === 'reconnecting' && (
            <span className="reconnecting">
              Reconnecting...
            </span>
          )}

        </div>


        <div className="topbar-actions">

          <button
            className="invite-button"
            onClick={copy}
          >
            <span>↗</span>
            <span className="invite-text">
              Copy invite
            </span>
          </button>


          {me && (
            <div className="current-user">

              <div className="user-avatar">
                {me.username
                  ?.charAt(0)
                  ?.toUpperCase() || '?'}
              </div>

              <div className="user-info">
                <strong>{me.username}</strong>
                <small>{me.role}</small>
              </div>

            </div>
          )}


          <button
            className="danger leave-button"
            onClick={wp.leave}
          >
            Leave
          </button>

        </div>

      </header>


      {/* =====================================================
          MAIN APPLICATION
      ===================================================== */}

      <div className="room-content">


        {/* ===================================================
            VIDEO AREA
        =================================================== */}

        <main className="stage stage-new">

          <div className="watch-header">

            <div>
              <span className="watch-kicker">
                NOW WATCHING
              </span>

              <h1>
                Shared watch room
              </h1>
            </div>

            <div className="watch-status">
              <span />
              Everyone is synced
            </div>

          </div>


          <div className="video-card">

            <Player
              sync={wp.sync}
              canControl={canControl}
              onAction={onAction}
            >
              <div
                className="reactions"
                aria-hidden="true"
              >
                {wp.reactions.map((r) => (
                  <span
                    key={r.id}
                    style={{
                      left: `${r.left}%`,
                    }}
                    title={r.username}
                  >
                    {r.emoji}
                  </span>
                ))}
              </div>
            </Player>

          </div>


          {/* Reactions */}
          <div className="reaction-section">

            <div className="reaction-label">
              React
            </div>

            <div
              className="emoji-bar emoji-bar-new"
              role="group"
              aria-label="Reactions"
            >
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() =>
                    act('reaction', {
                      emoji,
                    })
                  }
                  aria-label={`React ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

          </div>


          <div className="watch-tip">
            <span>💡</span>

            <p>
              {canControl
                ? 'You have control of the player. Everyone will stay synchronized with your actions.'
                : 'You are watching as a guest. Request playback actions from the host when needed.'}
            </p>
          </div>

        </main>


        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <aside className="side side-new">

          <div className="sidebar-header">

            <div>
              <span className="sidebar-kicker">
                ROOM
              </span>

              <h2>
                Party activity
              </h2>
            </div>

            <div className="online-indicator">
              <span />
              {wp.participants.length}
            </div>

          </div>


          {/* Tabs */}
          <div
            className="tabs tabs-new"
            role="tablist"
          >

            <button
              role="tab"
              aria-selected={tab === 'people'}
              className={
                tab === 'people'
                  ? 'on'
                  : ''
              }
              onClick={() =>
                switchTab('people')
              }
            >
              <span className="tab-icon">
                ●
              </span>

              <span>People</span>

              <em>
                {wp.participants.length}
              </em>
            </button>


            <button
              role="tab"
              aria-selected={tab === 'requests'}
              className={
                tab === 'requests'
                  ? 'on'
                  : ''
              }
              onClick={() =>
                switchTab('requests')
              }
            >
              <span className="tab-icon">
                ✓
              </span>

              <span>Requests</span>

              {wp.requests.length > 0 && (
                <b className="badge">
                  {wp.requests.length}
                </b>
              )}
            </button>


            <button
              role="tab"
              aria-selected={tab === 'chat'}
              className={
                tab === 'chat'
                  ? 'on'
                  : ''
              }
              onClick={() =>
                switchTab('chat')
              }
            >
              <span className="tab-icon">
                ▰
              </span>

              <span>Chat</span>
            </button>

          </div>


          {/* Panel */}
          <div className="panel panel-new">

            {tab === 'people' && (
              <People
                participants={wp.participants}
                me={me}
                act={act}
              />
            )}

            {tab === 'requests' && (
              <Requests
                requests={wp.requests}
                canControl={canControl}
                act={act}
              />
            )}

            {tab === 'chat' && (
              <Chat
                chat={wp.chat}
                meId={wp.meId}
                act={act}
              />
            )}

          </div>

        </aside>

      </div>


      {/* =====================================================
          TOASTS
      ===================================================== */}

      <div
        className="toasts toasts-new"
        aria-live="polite"
      >
        {wp.toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.kind}`}
          >
            <span className="toast-icon">
              {t.kind === 'error'
                ? '!'
                : '✓'}
            </span>

            <span>
              {t.text}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}