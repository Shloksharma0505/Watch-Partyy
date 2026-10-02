import 'dotenv/config';
import { createApp } from './app.js';

const PORT = Number(process.env.PORT) || 3001;
const { server, manager } = createApp();

await manager.ready();
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Watch Party server listening on :${PORT}`);
});
