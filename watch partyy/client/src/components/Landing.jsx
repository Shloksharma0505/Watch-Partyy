import { useState } from 'react';

export default function Landing({ linkedRoom, notice, onStart }) {
  const [tab, setTab] = useState(linkedRoom ? 'join' : 'create');
  const [name, setName] = useState(
    () => localStorage.getItem('wp_name') || ''
  );
  const [code, setCode] = useState(linkedRoom);
  const [err, setErr] = useState('');

  const submit = (e) => {
    e.preventDefault();

    const username = name.trim();
    const roomId = code.trim().toUpperCase();

    if (!username) {
      return setErr('Enter a display name first.');
    }

    if (tab === 'join' && roomId.length < 4) {
      return setErr('Enter the room code you were given.');
    }

    localStorage.setItem('wp_name', username);

    onStart({
      mode: tab,
      roomId: tab === 'join' ? roomId : '',
      username,
    });
  };

  return (
    <main className="landing landing-new">

      {/* Background decoration */}
      <div className="landing-glow landing-glow-one" />
      <div className="landing-glow landing-glow-two" />

      {/* ================= LEFT / HERO ================= */}
      <section className="hero hero-new">

        <div className="hero-topline">
          <span className="live-dot" />
          <span>LIVE WATCH PARTY</span>
        </div>

        <h1>
          Watch together.
          <br />
          <span>Stay in sync.</span>
        </h1>

        <p className="hero-description">
          Create a private watch room, invite your friends, and enjoy
          YouTube videos together in perfect sync — with live chat,
          reactions, and shared controls.
        </p>

        <div className="hero-actions-info">
          <div className="info-item">
            <span className="info-icon">▶</span>
            <div>
              <strong>Watch together</strong>
              <small>Everyone stays on the same frame</small>
            </div>
          </div>

          <div className="info-item">
            <span className="info-icon">⚡</span>
            <div>
              <strong>Real-time sync</strong>
              <small>Play, pause and seek together</small>
            </div>
          </div>

          <div className="info-item">
            <span className="info-icon">💬</span>
            <div>
              <strong>Chat & reactions</strong>
              <small>Talk while you watch</small>
            </div>
          </div>
        </div>

        <div className="feature-pills feature-pills-new">
          <span>Frame-accurate sync</span>
          <span>Private rooms</span>
          <span>No signup</span>
        </div>
      </section>


      {/* ================= RIGHT / ROOM CARD ================= */}
      <section className="landing-card">

        <div className="landing-card-header">
          <div>
            <span className="card-kicker">
              {tab === 'create' ? 'START WATCHING' : 'JOIN YOUR FRIENDS'}
            </span>

            <h2>
              {tab === 'create'
                ? 'Create your room'
                : 'Join a watch party'}
            </h2>

            <p>
              {tab === 'create'
                ? 'Start a private room and invite everyone.'
                : 'Enter the room code shared with you.'}
            </p>
          </div>

          <div className="card-icon">
            {tab === 'create' ? '✦' : '↗'}
          </div>
        </div>


        {/* Mode switch */}
        <div className="mode-switch" role="tablist" aria-label="Room mode">

          <button
            type="button"
            role="tab"
            aria-selected={tab === 'create'}
            className={tab === 'create' ? 'active' : ''}
            onClick={() => {
              setTab('create');
              setErr('');
            }}
          >
            <span>＋</span>
            Create room
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === 'join'}
            className={tab === 'join' ? 'active' : ''}
            onClick={() => {
              setTab('join');
              setErr('');
            }}
          >
            <span>↗</span>
            Join room
          </button>

        </div>


        {/* Form */}
        <form
          className="room-form"
          onSubmit={submit}
          noValidate
        >

          <label className="field">

            <span className="field-label">
              Display name
            </span>

            <div className="input-shell">
              <span className="input-icon">◉</span>

              <input
                id="wp-name"
                value={name}
                maxLength={24}
                autoFocus
                placeholder="Enter your name"
                onChange={(e) => {
                  setName(e.target.value);
                  setErr('');
                }}
              />
            </div>

            <small>
              This is how people in the room will see you.
            </small>

          </label>


          {tab === 'join' && (
            <label className="field">

              <span className="field-label">
                Room code
              </span>

              <div className="input-shell room-code-shell">
                <span className="input-icon">#</span>

                <input
                  id="wp-code"
                  className="code-input"
                  value={code}
                  maxLength={8}
                  placeholder="K7M2QX"
                  autoComplete="off"
                  onChange={(e) => {
                    setCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, '')
                    );
                    setErr('');
                  }}
                />
              </div>

              <small>
                Ask the host for the room code.
              </small>

            </label>
          )}


          {(err || notice) && (
            <div
              className={err ? 'form-message error' : 'form-message notice'}
              role="alert"
            >
              <span>{err ? '!' : '✓'}</span>
              {err || notice}
            </div>
          )}


          <button
            className="primary room-submit"
            type="submit"
          >
            <span>
              {tab === 'create'
                ? 'Create watch room'
                : 'Join watch party'}
            </span>

            <strong>→</strong>
          </button>

        </form>


        {/* Benefits */}
        <div className="room-benefits">

          <div className="benefit">
            <span>✓</span>
            <p>
              <strong>No account required</strong>
              <small>Just enter your name and start.</small>
            </p>
          </div>

          <div className="benefit">
            <span>✓</span>
            <p>
              <strong>Share one invite link</strong>
              <small>Friends can join instantly.</small>
            </p>
          </div>

          <div className="benefit">
            <span>✓</span>
            <p>
              <strong>Host controls the room</strong>
              <small>Guests can request actions.</small>
            </p>
          </div>

        </div>

      </section>

    </main>
  );
}