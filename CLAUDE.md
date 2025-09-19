# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Package manager**: pnpm

```bash
# Development
pnpm dev                # Start Next.js development server on http://localhost:3000

# Building and deployment
pnpm build             # Build for production
pnpm start             # Start production server

# Code quality
pnpm lint              # Run Next.js ESLint + Biome linting with auto-fix
pnpm lint:fix          # Run linting with aggressive fixes
pnpm format            # Format code with Biome

# Database operations
pnpm db:generate       # Generate Drizzle migrations
pnpm db:migrate        # Run database migrations
pnpm db:studio         # Open Drizzle Studio for database inspection
pnpm db:push           # Push schema changes directly to database
pnpm db:pull           # Pull schema from database
pnpm db:check          # Check migration files
pnpm db:up             # Apply migrations

# Services
docker compose up -d   # Start PostgreSQL and other services
```

## Architecture Overview

This is a **Next.js 15 app** using the **App Router** with TypeScript, built as an AI chat interface that integrates with **Model Context Protocol (MCP)** servers, particularly Pipedream's MCP server for API access.

### Key Technologies
- **Next.js 15** with App Router and React 19 RC
- **AI SDK** for LLM interactions with multiple providers (Anthropic, OpenAI, Google, etc.)
- **Drizzle ORM** with PostgreSQL for data persistence
- **Auth.js** for authentication
- **shadcn/ui + Radix UI** components with Tailwind CSS
- **Biome** for linting and formatting
- **MCP SDK** for tool/API integrations

### Directory Structure

- `app/` - Next.js App Router pages and API routes
  - `(auth)/` - Authentication pages and API routes
  - `(chat)/` - Main chat interface and related API endpoints
  - `api/` - Shared API routes
- `components/` - React components (shadcn/ui based)
- `lib/` - Core utilities and configurations
  - `ai/` - AI provider configurations, models, and prompts
  - `db/` - Database schema and migrations
  - `artifacts/` - Artifact handling logic
  - `editor/` - Text editor components
- `hooks/` - Custom React hooks
- `types/` - TypeScript type definitions

### Core Features

1. **Multi-LLM Support**: Configurable AI providers via `lib/ai/models.ts`
2. **MCP Integration**: Connects to APIs through Pipedream's MCP server
3. **Artifact System**: Generates and edits code/documents in chat
4. **Authentication**: Optional (can be disabled with `DISABLE_AUTH=true`)
5. **Persistence**: Optional (can be disabled with `DISABLE_PERSISTENCE=true`)

### Environment Configuration

The app supports flexible development modes:
- `DISABLE_AUTH=true` - Disables authentication for development
- `DISABLE_PERSISTENCE=true` - Disables database for development
- See `.env.example` for required environment variables

### Default Model
Default chat model is set to `claude-sonnet-4-0` in `lib/ai/models.ts`.

### Database
Uses Drizzle ORM with PostgreSQL. Schema is in `lib/db/schema.ts`. For local development, use `docker compose up -d` to start PostgreSQL, then run migrations with `pnpm db:migrate`.

### Authentication
Uses Auth.js with Google OAuth and credential-based auth. Can be completely disabled for development.