import { ACTION_TEXT } from '../lib/youtube.js';

export default function Requests({ requests, canControl, act }) {
  if (!requests.length) {
    return (
      <p className="empty">
        {canControl
          ? 'No pending requests. When a guest asks to play, pause, seek or change the video, it shows up here.'
          : "You haven't asked for anything yet. Use the player controls and your request will be sent to the host."}
      </p>
    );
  }
  return (
    <ul className="requests">
      {requests.map((r) => (
        <li key={r.id}>
          <p>
            {canControl ? <strong>{r.username}</strong> : <strong>You</strong>} {canControl ? 'wants to' : 'asked to'} {ACTION_TEXT[r.type](r.payload)}
          </p>
          {canControl ? (
            <div className="row-actions">
              <button className="primary" onClick={() => act('resolve_request', { requestId: r.id, approve: true })}>Approve</button>
              <button onClick={() => act('resolve_request', { requestId: r.id, approve: false })}>Decline</button>
            </div>
          ) : (
            <span className="pending">Waiting for approval&hellip;</span>
          )}
        </li>
      ))}
    </ul>
  );
}
