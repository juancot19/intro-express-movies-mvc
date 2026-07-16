# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the `api/` directory:

- **Dev server**: `npm run dev` (uses `node --watch src/app.js`)
- **Run tests**: `npm test` (runs `cross-env NODE_ENV=test vitest run`)
- **No build step** — uses ES modules directly

## Architecture

Express 5 + Mongoose MVC REST API for a movie ratings system. ES modules throughout (`"type": "module"`).

### Layout

```
api/
  src/
    app.js                    ← Express app setup and server entry point
    controllers/
      index.js                ← All route definitions
      movie.controller.js
      rating.controller.js
    lib/
      config.js               ← Port and MONGODB_URI from process.env
      db.js                   ← Mongoose connection
      logger.js               ← pino logger instance
      models/
        movie.model.js
        rating.model.js
    middlewares/
      errors.mid.js           ← notFound + globalHandler
      index.js                ← Barrel: export { errors }
```

### Key Patterns

- **Express 5**: Async exceptions are auto-captured — no try/catch needed in controllers
- **Error responses**: Use `http-errors` library (e.g., `throw createError(404, "Movie not found")`)
- **Mongoose 9**: Uses `toJSON: { virtuals: true }` on schemas for virtual field serialization
- **Logging**: pino + pino-http; logger imported from `src/lib/logger.js`
- **Testing**: Vitest + Supertest against the Express app; test file at `api/app.test.js`
