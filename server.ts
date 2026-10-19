import { app } from './src/serverApp.js';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();
process.env.DISABLE_HMR = 'true';

const PORT = 3000;

// Vite middleware for development (HMR disabled in cloud container)
const vite = await createViteServer({
  server: { middlewareMode: true, hmr: false, ws: false }
});
app.use(vite.middlewares);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SIAKAD SMA N 14 Tidore Kepulauan running on http://localhost:${PORT}`);
});
