import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { fileURLToPath } from 'url';

import cors from 'cors';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import dotenv from 'dotenv';

dotenv.config(); // Carrega variáveis do .env se estiver usando localmente

const PgSession = pgSession(session);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ CORS configurado para aceitar credenciais
app.use(cors({
  origin: 'https://lojateste-8tq0.onrender.com', // URL do frontend
  credentials: true
}));

app.set('trust proxy', 1); // 🔥 ESSENCIAL para funcionar com secure cookies atrás de proxy

// ✅ SESSÃO com PostgreSQL
app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL, // já configurado no Render
    tableName: 'session', // opcional se já estiver usando essa tabela
    createTableIfMissing: false, // já existe
  }),
  secret: process.env.SESSION_SECRET || '083Dinho@',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true, // importante no Render (https)
    sameSite: 'none', // necessário para cross-domain
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 dias
  }
}));

// ✅ Parse JSON e URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// ✅ Arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ✅ Log customizado para rotas /api
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// ✅ Log de cookies recebidos (debug)
app.use((req, res, next) => {
  console.log("Cookies recebidos:", req.headers.cookie);
  next();
});

(async () => {
  const server = await registerRoutes(app);

  // ✅ Handler global de erro
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ✅ Configuração para ambiente (Vite dev ou produção)
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
