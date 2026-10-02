import { useEffect, useRef, useState } from 'react';

export default function Chat({ chat, meId, act }) {
  const [text, setText] = useState('');
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [chat.length]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    act('chat_message', { text });
    setText('');
  };

  return (
    <div className="chat">
      <ul className="messages">
        {chat.length === 0 && <li className="empty">Say hi. Messages are only kept while the room is open.</li>}
        {chat.map((m) => (
          <li key={m.id} className={m.userId === meId ? 'mine' : ''}>
            <span className="who">{m.userId === meId ? 'You' : m.username}</span>
            <span className="msg">{m.text}</span>
          </li>
        ))}
        <li ref={end} aria-hidden="true" />
      </ul>
      <form onSubmit={send} className="chat-form">
        <input value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" aria-label="Message" />
        <button type="submit" className="primary">Send</button>
      </form>
    </div>
  );
}
