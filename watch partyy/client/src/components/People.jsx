const ASSIGNABLE = ['moderator', 'participant', 'viewer'];

export default function People({ participants, me, act }) {
  const isHost = me?.role === 'host';
  return (
    <ul className="people">
      {participants.map((p) => {
        const isMe = p.userId === me?.userId;
        const initial = (p.username || '?').trim().charAt(0).toUpperCase();
        return (
          <li key={p.userId}>
            <div className="person-row">
              <span className={`dot ${p.connected ? 'on' : ''}`} title={p.connected ? 'Online' : 'Reconnecting'} aria-label={p.connected ? 'Online' : 'Reconnecting'} />
              <span className="pname">{p.username}{isMe && <em> (you)</em>}</span>
              <span className={`role role-${p.role}`}>{p.role}</span>
            </div>
            {isHost && !isMe && (
              <div className="row-actions">
                <select
                  value={p.role}
                  aria-label={`Role for ${p.username}`}
                  onChange={(e) => act('assign_role', { userId: p.userId, role: e.target.value })}
                >
                  {ASSIGNABLE.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <button onClick={() => window.confirm(`Make ${p.username} the host? You'll become a moderator.`) && act('transfer_host', { userId: p.userId })}>
                  Make host
                </button>
                <button className="danger" onClick={() => window.confirm(`Remove ${p.username} from the room?`) && act('remove_participant', { userId: p.userId })}>
                  Remove
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
