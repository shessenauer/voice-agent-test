# POEPilot API Complete Implementation Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Request Lifecycle](#request-lifecycle)
4. [Middleware Stack](#middleware-stack)
5. [Configuration & Environment](#configuration--environment)
6. [Domain Implementation Pattern](#domain-implementation-pattern)
7. [Authentication & Authorization](#authentication--authorization)
8. [Validation Deep Dive](#validation-deep-dive)
9. [Error Handling](#error-handling)
10. [Repository Security Patterns](#repository-security-patterns)
11. [Async Processing & Job Queue](#async-processing--job-queue)
12. [WebSocket Real-Time Communication](#websocket-real-time-communication)
13. [Database Design & RLS](#database-design--rls)
14. [Testing Patterns](#testing-patterns)
15. [Common Tasks](#common-tasks)
16. [Troubleshooting](#troubleshooting)

---

## Introduction

This is the **definitive guide** for backend development in POEPilot. Every pattern, convention, and implementation detail is documented here.

### Purpose
- Onboard new developers quickly
- Ensure consistency across all domains
- Document critical security patterns
- Provide copy-paste code templates

### Prerequisites
- Node.js 18+
- TypeScript knowledge
- Understanding of REST APIs
- Familiarity with Express.js

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   HTTP Request                       │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│              Middleware Stack                        │
│  Security → Parsing → Tracking → Auth → Routes      │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│                Route Handler                         │
│         (asyncHandler wrapped)                       │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│                Controller                            │
│    Extract request data → Call service               │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│                 Service                              │
│   Business logic → Orchestrate repositories          │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│               Repository                             │
│   Database queries → Enforce user_id security        │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│            Supabase PostgreSQL                       │
│              (with RLS enabled)                      │
└─────────────────────────────────────────────────────┘
```

### Key Principles

1. **Feature Slicing**: Code organized by business domains
2. **Layered Architecture**: Clear separation of concerns
3. **Dependency Injection**: Services receive dependencies via constructor
4. **Security First**: User ownership enforced at every layer
5. **Type Safety**: TypeScript strict mode throughout
6. **Fail Fast**: Validate early, throw specific errors

---

## Request Lifecycle

### Complete Request Flow

```
1. Request arrives at Express app
   ↓
2. Security middleware (helmet, CORS)
   ↓
3. Body parsing (json, urlencoded)
   ↓
4. Request tracking (ID, timing, logging)
   ↓
5. Rate limiting (selective)
   ↓
6. Authentication (JWT validation)
   ↓
7. Validation (Zod schema)
   ↓
8. Route handler (asyncHandler wrapped)
   ↓
9. Controller extracts data
   ↓
10. Service implements business logic
   ↓
11. Repository queries database
   ↓
12. Response formatted and sent
   ↓
13. (If error) Error handler catches and formats
```

### Timing Example

```typescript
// Request tracking provides timing information
{
  requestId: "req_1234567890",
  method: "POST",
  path: "/api/projects",
  duration: "45ms",
  statusCode: 201
}
```

---

## Middleware Stack

### Complete Middleware Reference

| Middleware | File | Purpose | Order | Required |
|------------|------|---------|-------|----------|
| `helmet()` | Built-in | Security headers | 1 | ✓ |
| `compression()` | Built-in | Response compression | 2 | ✓ |
| `cors()` | Built-in | CORS configuration | 3 | ✓ |
| `express.json()` | Built-in | Parse JSON bodies | 4 | ✓ |
| `express.urlencoded()` | Built-in | Parse URL-encoded | 5 | ✓ |
| `requestIdMiddleware` | `requestId.ts` | Assign unique request ID | 6 | ✓ |
| `responseTimeMiddleware` | `responseTime.ts` | Track response time | 7 | ✓ |
| `requestLogger` | `requestLogger.ts` | Log all requests | 8 | ✓ |
| `selectiveRateLimiter` | `selectiveRateLimiter.ts` | Rate limiting with exclusions | 9 | ✓ |
| `conditionalAuthMiddleware` | `conditionalAuth.ts` | Auth enforcement | 10 | ✓ |
| `validateRequest(schema)` | `validation.ts` | Zod validation | Per route | Route-specific |
| `asyncHandler(fn)` | `asyncHandler.ts` | Catch async errors | Per route | ✓ |
| `errorHandler` | `errorHandler.ts` | Global error handler | Last | ✓ |

### Critical Middleware Details

#### 1. asyncHandler (CRITICAL)

**Purpose**: Catches errors from async route handlers and passes to error middleware

**File**: `api/src/middleware/asyncHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

**Usage**:
```typescript
// ✓ CORRECT - Errors are caught
router.get('/', asyncHandler(async (req, res) => {
  const data = await someAsyncOperation();
  res.json({ data });
}));

// ✗ WRONG - Errors crash the server
router.get('/', async (req, res) => {
  const data = await someAsyncOperation();
  res.json({ data });
});
```

**Why it matters**: Without asyncHandler, unhandled promise rejections crash your server.

#### 2. conditionalAuthMiddleware (CRITICAL)

**Purpose**: Enforces authentication in production, allows bypass in development

**File**: `api/src/middleware/conditionalAuth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from './auth';
import { authMiddlewareDev } from './auth-dev';
import { config } from '@/config/env';

export const conditionalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Allow auth bypass ONLY in development with explicit flag
  if (config.NODE_ENV === 'development' && config.BYPASS_AUTH) {
    console.warn('⚠️  AUTH BYPASS ENABLED - Development mode only');
    return authMiddlewareDev(req, res, next);
  }

  // Production always requires valid JWT
  return authMiddleware(req, res, next);
};
```

**Environment Variable**:
```bash
BYPASS_AUTH=true  # Development only - DO NOT USE IN PRODUCTION
```

**When to use**:
- ✓ Local development without frontend
- ✓ Testing API endpoints directly
- ✗ NEVER in production
- ✗ NEVER commit BYPASS_AUTH=true to .env files

**Development auth** injects a fake user:
```typescript
// auth-dev.ts
req.user = {
  id: 'dev-user-id',
  email: 'dev@example.com',
  metadata: { role: 'developer' }
};
```

#### 3. selectiveRateLimiter (IMPORTANT)

**Purpose**: Rate limit API endpoints with exceptions

**File**: `api/src/middleware/selectiveRateLimiter.ts`

```typescript
import rateLimit from 'express-rate-limit';
import { config } from '@/config/env';

const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 15 minutes
  max: config.RATE_LIMIT_MAX_REQUESTS,   // 100 requests
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const selectiveRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Exclude health checks
  if (req.path.startsWith('/health')) {
    return next();
  }

  // Exclude auth endpoints (they have their own limiting)
  if (req.path.startsWith('/api/auth')) {
    return next();
  }

  // Apply rate limiting
  return limiter(req, res, next);
};
```

**Configuration**:
```bash
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # Max requests per window
```

#### 4. Request Tracking Middleware

**requestIdMiddleware**:
```typescript
// Assigns unique ID to each request
req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
```

**responseTimeMiddleware**:
```typescript
// Tracks how long each request takes
const start = Date.now();
res.on('finish', () => {
  const duration = Date.now() - start;
  console.log(`${req.method} ${req.path} - ${duration}ms`);
});
```

**requestLogger**:
```typescript
// Logs all incoming requests
console.log({
  requestId: req.id,
  method: req.method,
  path: req.path,
  ip: req.ip,
  userAgent: req.get('user-agent')
});
```

---

## Configuration & Environment

### Environment Variable Reference

#### Server Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port |
| `NODE_ENV` | Yes | - | Environment: `development`, `production`, `test` |
| `BYPASS_AUTH` | No | `false` | **DEV ONLY** - Bypass authentication |

#### Supabase Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | Yes | - | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | - | Service role key (full access) |
| `SUPABASE_ANON_KEY` | No | - | Anonymous key (public access) |

#### AI API Keys

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | - | Claude API key |
| `OPENAI_API_KEY` | No | - | OpenAI API key (optional) |
| `COHERE_API_KEY` | No | - | Cohere API key (optional) |
| `FAL_AI_API_KEY` | No | - | Fal AI key for image generation |

#### Database Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEO4J_URI` | No | - | Neo4j database URI |
| `NEO4J_USER` | No | - | Neo4j username |
| `NEO4J_PASSWORD` | No | - | Neo4j password |
| `CHROMADB_URL` | No | - | ChromaDB URL for vector storage |

#### File Upload Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MAX_FILE_SIZE` | No | `10485760` | Max file size in bytes (10MB) |
| `ALLOWED_FILE_TYPES` | No | `pdf,docx,txt` | Comma-separated file types |

#### Rate Limiting

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per window |

### Environment File Structure

**`.env.example`** (template):
```bash
# Server
PORT=3001
NODE_ENV=development
BYPASS_AUTH=false

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI APIs
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
FAL_AI_API_KEY=...

# Databases (optional)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
CHROMADB_URL=http://localhost:8000

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,docx,txt,md

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Configuration Loading Pattern

**File**: `api/src/config/env.ts`

```typescript
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Define schema with validation
const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BYPASS_AUTH: z.coerce.boolean().default(false),

  // Supabase (required)
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // AI APIs
  ANTHROPIC_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  FAL_AI_API_KEY: z.string().optional(),

  // File upload
  MAX_FILE_SIZE: z.coerce.number().default(10 * 1024 * 1024),
  ALLOWED_FILE_TYPES: z.string().default('pdf,docx,txt'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

// Load and validate
function loadConfig() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      // Production requires all env vars
      console.error('❌ Environment validation failed:', error);
      process.exit(1);
    } else {
      // Development shows warnings but continues
      console.warn('⚠️  Environment validation warnings:', error);
      return envSchema.parse({
        ...process.env,
        // Provide safe defaults for development
      });
    }
  }
}

export const config = loadConfig();
```

**Key Features**:
- ✓ Type-safe configuration
- ✓ Zod validation with helpful errors
- ✓ Default values for development
- ✓ Production fails fast on missing vars
- ✓ Development shows warnings but continues

---

## Domain Implementation Pattern

### Standard Domain Structure

```
api/src/domains/[domain-name]/
├── index.ts                    # Public exports
├── [domain-name].types.ts      # TypeScript types
├── [domain-name].schemas.ts    # Zod validation schemas
├── [domain-name].errors.ts     # Domain-specific errors
├── [domain-name].repository.ts # Data access layer
├── [domain-name].service.ts    # Business logic
├── [domain-name].controller.ts # HTTP handlers
└── [domain-name].routes.ts     # Route definitions
```

**Note**: Newer domains may use simple names (`types.ts`, `service.ts`, etc.) instead of prefixed names. Both patterns are acceptable.

### Step-by-Step: Creating a New Domain

Let's create a complete `books` domain as an example.

#### Step 1: Create Domain Directory

```bash
mkdir -p api/src/domains/books
cd api/src/domains/books
```

#### Step 2: Define Types (`books.types.ts`)

```typescript
// Base entity
export interface Book {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  cover_url?: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// Data Transfer Objects
export interface CreateBookDTO {
  project_id: string;
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  cover_url?: string;
  metadata?: Record<string, any>;
}

export interface UpdateBookDTO {
  title?: string;
  author?: string;
  isbn?: string;
  description?: string;
  cover_url?: string;
  metadata?: Record<string, any>;
}

// Query filters
export interface BookFilters {
  project_id?: string;
  search?: string;
  author?: string;
  limit?: number;
  offset?: number;
}

// Statistics
export interface BookStats {
  total_books: number;
  total_authors: number;
  recent_books: number;
}
```

#### Step 3: Create Validation Schemas (`books.schemas.ts`)

```typescript
import { z } from 'zod';

// UUID validation helper
const uuidSchema = z.string().uuid('Invalid UUID format');

// Create book schema
export const createBookSchema = z.object({
  body: z.object({
    project_id: uuidSchema,
    title: z.string().min(1, 'Title is required').max(500),
    author: z.string().min(1, 'Author is required').max(255),
    isbn: z.string().regex(/^[\d-]{10,17}$/, 'Invalid ISBN').optional(),
    description: z.string().max(5000).optional(),
    cover_url: z.string().url('Invalid URL').optional(),
    metadata: z.record(z.any()).default({}),
  }),
});

// Update book schema
export const updateBookSchema = z.object({
  params: z.object({
    bookId: uuidSchema,
  }),
  body: z.object({
    title: z.string().min(1).max(500).optional(),
    author: z.string().min(1).max(255).optional(),
    isbn: z.string().regex(/^[\d-]{10,17}$/).optional(),
    description: z.string().max(5000).optional(),
    cover_url: z.string().url().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

// Get book by ID schema
export const getBookSchema = z.object({
  params: z.object({
    bookId: uuidSchema,
  }),
});

// List books schema
export const listBooksSchema = z.object({
  query: z.object({
    project_id: uuidSchema.optional(),
    search: z.string().optional(),
    author: z.string().optional(),
    limit: z.coerce.number().int().positive().max(100).default(20),
    offset: z.coerce.number().int().nonnegative().default(0),
  }),
});

// Export inferred types
export type CreateBookInput = z.infer<typeof createBookSchema>['body'];
export type UpdateBookInput = z.infer<typeof updateBookSchema>['body'];
export type BookFiltersInput = z.infer<typeof listBooksSchema>['query'];
```

#### Step 4: Define Domain Errors (`books.errors.ts`)

```typescript
export class BookNotFoundError extends Error {
  public readonly statusCode = 404;

  constructor(bookId: string) {
    super(`Book with id ${bookId} not found`);
    this.name = 'BookNotFoundError';
    Object.setPrototypeOf(this, BookNotFoundError.prototype);
  }
}

export class BookValidationError extends Error {
  public readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'BookValidationError';
    Object.setPrototypeOf(this, BookValidationError.prototype);
  }
}

export class BookAuthorizationError extends Error {
  public readonly statusCode = 403;

  constructor(message: string = 'Unauthorized to access this book') {
    super(message);
    this.name = 'BookAuthorizationError';
    Object.setPrototypeOf(this, BookAuthorizationError.prototype);
  }
}

export class DuplicateISBNError extends Error {
  public readonly statusCode = 409;

  constructor(isbn: string) {
    super(`A book with ISBN ${isbn} already exists in this project`);
    this.name = 'DuplicateISBNError';
    Object.setPrototypeOf(this, DuplicateISBNError.prototype);
  }
}
```

#### Step 5: Implement Repository (`books.repository.ts`)

```typescript
import { supabase } from '@/lib/supabase';
import type {
  Book,
  CreateBookDTO,
  UpdateBookDTO,
  BookFilters,
  BookStats,
} from './books.types';

export class BookRepository {
  private readonly table = 'books';

  /**
   * Find all books with filters
   * SECURITY: Always filters by user_id
   */
  async findAll(userId: string, filters: BookFilters = {}): Promise<Book[]> {
    let query = supabase
      .from(this.table)
      .select('*')
      .eq('user_id', userId) // CRITICAL: Enforce ownership
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.project_id) {
      query = query.eq('project_id', filters.project_id);
    }

    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,author.ilike.%${filters.search}%`
      );
    }

    if (filters.author) {
      query = query.ilike('author', `%${filters.author}%`);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 20) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch books: ${error.message}`);
    }

    return data as Book[];
  }

  /**
   * Find book by ID
   * SECURITY: Always checks user_id
   */
  async findById(bookId: string, userId: string): Promise<Book | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', bookId)
      .eq('user_id', userId) // CRITICAL: Enforce ownership
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch book: ${error.message}`);
    }

    return data as Book;
  }

  /**
   * Create new book
   */
  async create(userId: string, data: CreateBookDTO): Promise<Book> {
    const bookData = {
      ...data,
      user_id: userId,
      metadata: data.metadata || {},
    };

    const { data: book, error } = await supabase
      .from(this.table)
      .insert(bookData)
      .select()
      .single();

    if (error) {
      // Check for duplicate ISBN
      if (error.code === '23505' && error.message.includes('isbn')) {
        throw new Error('DUPLICATE_ISBN');
      }
      throw new Error(`Failed to create book: ${error.message}`);
    }

    return book as Book;
  }

  /**
   * Update book
   * SECURITY: Only updates if user owns the book
   */
  async update(
    bookId: string,
    userId: string,
    data: UpdateBookDTO
  ): Promise<Book | null> {
    const { data: book, error } = await supabase
      .from(this.table)
      .update({ ...data, updated_at: new Date() })
      .eq('id', bookId)
      .eq('user_id', userId) // CRITICAL: Enforce ownership
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found or not owned
      }
      throw new Error(`Failed to update book: ${error.message}`);
    }

    return book as Book;
  }

  /**
   * Delete book
   * SECURITY: Only deletes if user owns the book
   */
  async delete(bookId: string, userId: string): Promise<boolean> {
    const { error, count } = await supabase
      .from(this.table)
      .delete({ count: 'exact' })
      .eq('id', bookId)
      .eq('user_id', userId); // CRITICAL: Enforce ownership

    if (error) {
      throw new Error(`Failed to delete book: ${error.message}`);
    }

    return (count ?? 0) > 0;
  }

  /**
   * Check if book exists
   */
  async exists(bookId: string, userId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from(this.table)
      .select('id', { count: 'exact', head: true })
      .eq('id', bookId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to check book existence: ${error.message}`);
    }

    return (count ?? 0) > 0;
  }

  /**
   * Get statistics
   */
  async getStats(projectId: string, userId: string): Promise<BookStats> {
    const { count: totalBooks, error: countError } = await supabase
      .from(this.table)
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (countError) {
      throw new Error(`Failed to get book stats: ${countError.message}`);
    }

    const { data: authors, error: authorsError } = await supabase
      .from(this.table)
      .select('author')
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (authorsError) {
      throw new Error(`Failed to get authors: ${authorsError.message}`);
    }

    const uniqueAuthors = new Set(authors.map((b) => b.author));

    // Recent books (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentBooks, error: recentError } = await supabase
      .from(this.table)
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString());

    if (recentError) {
      throw new Error(`Failed to get recent books: ${recentError.message}`);
    }

    return {
      total_books: totalBooks ?? 0,
      total_authors: uniqueAuthors.size,
      recent_books: recentBooks ?? 0,
    };
  }
}
```

**Key Repository Patterns**:
- ✓ ALWAYS filter by `user_id` for security
- ✓ Handle Supabase error codes explicitly
- ✓ Return `null` for not found (don't throw)
- ✓ Throw errors for database issues
- ✓ Use type assertions for returned data

#### Step 6: Implement Service (`books.service.ts`)

```typescript
import { BookRepository } from './books.repository';
import type {
  Book,
  CreateBookDTO,
  UpdateBookDTO,
  BookFilters,
  BookStats,
} from './books.types';
import {
  BookNotFoundError,
  BookValidationError,
  BookAuthorizationError,
  DuplicateISBNError,
} from './books.errors';

export class BookService {
  constructor(private readonly repository: BookRepository) {}

  /**
   * Get all books with filters
   */
  async getBooks(userId: string, filters: BookFilters = {}): Promise<Book[]> {
    if (!userId) {
      throw new BookValidationError('User ID is required');
    }

    return this.repository.findAll(userId, filters);
  }

  /**
   * Get single book by ID
   */
  async getBookById(bookId: string, userId: string): Promise<Book> {
    if (!bookId) {
      throw new BookValidationError('Book ID is required');
    }

    if (!userId) {
      throw new BookValidationError('User ID is required');
    }

    const book = await this.repository.findById(bookId, userId);

    if (!book) {
      throw new BookNotFoundError(bookId);
    }

    return book;
  }

  /**
   * Create new book
   */
  async createBook(userId: string, data: CreateBookDTO): Promise<Book> {
    // Validate user ID
    if (!userId) {
      throw new BookValidationError('User ID is required');
    }

    // Business validation
    if (!data.title || data.title.trim().length === 0) {
      throw new BookValidationError('Book title cannot be empty');
    }

    if (!data.author || data.author.trim().length === 0) {
      throw new BookValidationError('Book author cannot be empty');
    }

    // Normalize data
    const normalizedData = {
      ...data,
      title: data.title.trim(),
      author: data.author.trim(),
      metadata: data.metadata || {},
    };

    try {
      return await this.repository.create(userId, normalizedData);
    } catch (error) {
      if (error instanceof Error && error.message === 'DUPLICATE_ISBN') {
        throw new DuplicateISBNError(data.isbn!);
      }
      throw error;
    }
  }

  /**
   * Update book
   */
  async updateBook(
    bookId: string,
    userId: string,
    data: UpdateBookDTO
  ): Promise<Book> {
    // Validate IDs
    if (!bookId) {
      throw new BookValidationError('Book ID is required');
    }

    if (!userId) {
      throw new BookValidationError('User ID is required');
    }

    // Ensure book exists and user owns it
    const existingBook = await this.getBookById(bookId, userId);

    // Business validation
    if (data.title !== undefined && data.title.trim().length === 0) {
      throw new BookValidationError('Book title cannot be empty');
    }

    if (data.author !== undefined && data.author.trim().length === 0) {
      throw new BookValidationError('Book author cannot be empty');
    }

    // Normalize data
    const normalizedData: UpdateBookDTO = {};

    if (data.title !== undefined) {
      normalizedData.title = data.title.trim();
    }

    if (data.author !== undefined) {
      normalizedData.author = data.author.trim();
    }

    if (data.description !== undefined) {
      normalizedData.description = data.description;
    }

    if (data.isbn !== undefined) {
      normalizedData.isbn = data.isbn;
    }

    if (data.cover_url !== undefined) {
      normalizedData.cover_url = data.cover_url;
    }

    if (data.metadata !== undefined) {
      normalizedData.metadata = {
        ...existingBook.metadata,
        ...data.metadata,
      };
    }

    const updated = await this.repository.update(bookId, userId, normalizedData);

    if (!updated) {
      throw new BookNotFoundError(bookId);
    }

    return updated;
  }

  /**
   * Delete book
   */
  async deleteBook(bookId: string, userId: string): Promise<void> {
    // Validate IDs
    if (!bookId) {
      throw new BookValidationError('Book ID is required');
    }

    if (!userId) {
      throw new BookValidationError('User ID is required');
    }

    // Ensure book exists and user owns it
    await this.getBookById(bookId, userId);

    const deleted = await this.repository.delete(bookId, userId);

    if (!deleted) {
      throw new BookNotFoundError(bookId);
    }
  }

  /**
   * Get book statistics
   */
  async getBookStats(projectId: string, userId: string): Promise<BookStats> {
    if (!projectId) {
      throw new BookValidationError('Project ID is required');
    }

    if (!userId) {
      throw new BookValidationError('User ID is required');
    }

    return this.repository.getStats(projectId, userId);
  }

  /**
   * Check if book exists
   */
  async bookExists(bookId: string, userId: string): Promise<boolean> {
    return this.repository.exists(bookId, userId);
  }
}
```

**Key Service Patterns**:
- ✓ Validate all inputs
- ✓ Implement business rules
- ✓ Normalize data (trim strings, merge objects)
- ✓ Check ownership before operations
- ✓ Throw domain-specific errors
- ✓ Don't leak database errors to controller

#### Step 7: Implement Controller (`books.controller.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';
import { BookService } from './books.service';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    metadata: Record<string, any>;
  };
}

export class BookController {
  constructor(private readonly service: BookService) {}

  /**
   * GET /api/books
   * List all books with filters
   */
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const filters = req.query;

      const books = await this.service.getBooks(userId, filters);

      res.json({
        success: true,
        data: books,
        meta: {
          count: books.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/books/:bookId
   * Get single book by ID
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookId } = req.params;
      const userId = req.user!.id;

      const book = await this.service.getBookById(bookId, userId);

      res.json({
        success: true,
        data: book,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/books
   * Create new book
   */
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = req.body;

      const book = await this.service.createBook(userId, data);

      res.status(201).json({
        success: true,
        data: book,
        message: 'Book created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/books/:bookId
   * Update book
   */
  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookId } = req.params;
      const userId = req.user!.id;
      const data = req.body;

      const book = await this.service.updateBook(bookId, userId, data);

      res.json({
        success: true,
        data: book,
        message: 'Book updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/books/:bookId
   * Delete book
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookId } = req.params;
      const userId = req.user!.id;

      await this.service.deleteBook(bookId, userId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/books/stats/:projectId
   * Get book statistics
   */
  async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user!.id;

      const stats = await this.service.getBookStats(projectId, userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
```

**Key Controller Patterns**:
- ✓ Very thin - just extract data and call service
- ✓ Always get userId from `req.user` (set by auth middleware)
- ✓ Use async/await
- ✓ Pass errors to `next()` for error middleware
- ✓ Return consistent response format

#### Step 8: Define Routes (`books.routes.ts`)

```typescript
import { Router } from 'express';
import { BookController } from './books.controller';
import { BookService } from './books.service';
import { BookRepository } from './books.repository';
import { conditionalAuthMiddleware } from '@/middleware/conditionalAuth';
import { validateRequest } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/asyncHandler';
import {
  createBookSchema,
  updateBookSchema,
  getBookSchema,
  listBooksSchema,
} from './books.schemas';

const router = Router();

// Initialize layers (dependency injection)
const repository = new BookRepository();
const service = new BookService(repository);
const controller = new BookController(service);

// All routes require authentication
router.use(conditionalAuthMiddleware);

/**
 * GET /api/books
 * List books with optional filters
 */
router.get(
  '/',
  validateRequest(listBooksSchema),
  asyncHandler(controller.list.bind(controller))
);

/**
 * GET /api/books/:bookId
 * Get single book by ID
 */
router.get(
  '/:bookId',
  validateRequest(getBookSchema),
  asyncHandler(controller.getById.bind(controller))
);

/**
 * POST /api/books
 * Create new book
 */
router.post(
  '/',
  validateRequest(createBookSchema),
  asyncHandler(controller.create.bind(controller))
);

/**
 * PATCH /api/books/:bookId
 * Update book
 */
router.patch(
  '/:bookId',
  validateRequest(updateBookSchema),
  asyncHandler(controller.update.bind(controller))
);

/**
 * DELETE /api/books/:bookId
 * Delete book
 */
router.delete(
  '/:bookId',
  validateRequest(getBookSchema),
  asyncHandler(controller.delete.bind(controller))
);

/**
 * GET /api/books/stats/:projectId
 * Get book statistics for project
 */
router.get(
  '/stats/:projectId',
  asyncHandler(controller.getStats.bind(controller))
);

export default router;
```

**Key Route Patterns**:
- ✓ Initialize dependencies at top
- ✓ Apply auth middleware to all routes
- ✓ Validate with Zod schemas
- ✓ Wrap handlers with asyncHandler
- ✓ Bind controller methods (preserve `this` context)
- ✓ Add comments for route documentation

#### Step 9: Export Public API (`index.ts`)

```typescript
// Types
export * from './books.types';
export * from './books.schemas';

// Services (for use by other domains)
export { BookService } from './books.service';
export { BookRepository } from './books.repository';

// Errors (for error handling)
export * from './books.errors';

// Routes (for mounting in main app)
export { default as bookRoutes } from './books.routes';
```

#### Step 10: Register Routes in Main App

**File**: `api/src/index.ts`

```typescript
import express from 'express';
import { bookRoutes } from '@/domains/books';

const app = express();

// ... middleware setup ...

// Register routes
app.use('/api/books', bookRoutes);

// ... error handler ...
```

---

## Authentication & Authorization

### JWT Token Flow

```
1. User logs in via frontend
   ↓
2. Supabase Auth returns JWT access token
   ↓
3. Frontend includes token in Authorization header
   ↓
4. API auth middleware validates token with Supabase
   ↓
5. If valid, middleware attaches user to request
   ↓
6. Route handler accesses req.user
```

### Auth Middleware Implementation

**File**: `api/src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { supabase } from '@/lib/supabase';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    metadata: Record<string, any>;
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Validate token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    // Attach user to request for downstream handlers
    req.user = {
      id: user.id,
      email: user.email || '',
      metadata: user.user_metadata || {},
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}
```

### Authorization Patterns

#### 1. Resource Ownership (Most Common)

Check in service layer before operations:

```typescript
async getBookById(bookId: string, userId: string): Promise<Book> {
  const book = await this.repository.findById(bookId, userId);

  if (!book) {
    throw new BookNotFoundError(bookId);
  }

  // Ownership is enforced in repository query
  // If book is returned, user owns it
  return book;
}
```

#### 2. Role-Based Access Control

Create custom middleware for role checks:

```typescript
// middleware/requireRole.ts
export function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.user.metadata.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Usage in routes
router.delete(
  '/admin/:bookId',
  conditionalAuthMiddleware,
  requireRole('admin'),
  asyncHandler(controller.adminDelete.bind(controller))
);
```

#### 3. Project-Based Access

Check project ownership:

```typescript
async canAccessProject(userId: string, projectId: string): Promise<boolean> {
  const project = await projectRepository.findById(projectId, userId);
  return !!project;
}

// Use in service
async createBook(userId: string, data: CreateBookDTO): Promise<Book> {
  // Verify user has access to project
  const hasAccess = await this.canAccessProject(userId, data.project_id);
  if (!hasAccess) {
    throw new BookAuthorizationError('Cannot add books to this project');
  }

  return this.repository.create(userId, data);
}
```

---

## Validation Deep Dive

### Full Request Validation Pattern

**Key Concept**: Validate body + params + query together, not separately.

```typescript
export const updateBookSchema = z.object({
  // URL parameters
  params: z.object({
    bookId: z.string().uuid('Invalid book ID'),
  }),

  // Request body
  body: z.object({
    title: z.string().min(1).max(500).optional(),
    author: z.string().min(1).max(255).optional(),
  }),

  // Query parameters (if any)
  query: z.object({
    notify: z.coerce.boolean().default(false),
  }).optional(),
});
```

### Validation Middleware

**File**: `api/src/middleware/validation.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateRequest(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate entire request structure
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
        return;
      }

      // Unexpected error
      next(error);
    }
  };
}
```

### Common Validation Patterns

#### UUID Validation

```typescript
const uuidSchema = z.string().uuid('Invalid UUID format');

export const getByIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});
```

#### Email Validation

```typescript
const emailSchema = z.string().email('Invalid email address');
```

#### Enum Validation

```typescript
const statusEnum = z.enum(['draft', 'published', 'archived']);

export const updateStatusSchema = z.object({
  body: z.object({
    status: statusEnum,
  }),
});
```

#### Array Validation

```typescript
const tagsSchema = z.array(z.string().min(1)).max(10);

export const updateTagsSchema = z.object({
  body: z.object({
    tags: tagsSchema,
  }),
});
```

#### Nested Object Validation

```typescript
const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zip: z.string().regex(/^\d{5}$/),
});

export const updateAddressSchema = z.object({
  body: z.object({
    address: addressSchema,
  }),
});
```

#### Custom Validation

```typescript
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character');
```

#### Conditional Validation

```typescript
const createSchema = z
  .object({
    type: z.enum(['book', 'article']),
    isbn: z.string().optional(),
    url: z.string().url().optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'book') return !!data.isbn;
      if (data.type === 'article') return !!data.url;
      return true;
    },
    {
      message: 'Books require ISBN, articles require URL',
    }
  );
```

---

## Error Handling

### Error Handling Flow

```
Error thrown anywhere in application
  ↓
asyncHandler catches if in route handler
  ↓
Passes error to next(error)
  ↓
Express error handling middleware
  ↓
Error formatted and sent to client
```

### Global Error Handler

**File**: `api/src/middleware/errorHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    requestId: req.id,
  });

  // Zod validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
    return;
  }

  // Domain-specific errors with statusCode
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: 'code' in error ? error.code : undefined,
    });
    return;
  }

  // AppError instances
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
    });
    return;
  }

  // Default server error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      details: error.message,
      stack: error.stack,
    }),
  });
}
```

### Error Response Format

All errors return consistent JSON:

```typescript
{
  success: false,
  error: "Human-readable error message",
  code: "OPTIONAL_ERROR_CODE",
  details: [] // For validation errors
}
```

### HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 400 | Bad Request | Validation errors, malformed input |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (e.g., duplicate) |
| 422 | Unprocessable Entity | Business logic validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | External service down |

---

## Repository Security Patterns

### Critical Security Rule

**ALWAYS filter by `user_id` in repository queries.**

This is the most important security pattern in the entire codebase.

### Bad Example (INSECURE)

```typescript
// ❌ DANGEROUS - No user_id check
async findById(bookId: string): Promise<Book | null> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId) // Any user can access any book!
    .single();

  return data;
}
```

### Good Example (SECURE)

```typescript
// ✓ SECURE - Enforces ownership
async findById(bookId: string, userId: string): Promise<Book | null> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .eq('user_id', userId) // Only returns if user owns it
    .single();

  return data;
}
```

### Security Checklist

For every repository method:

- [ ] Takes `userId` as parameter
- [ ] Filters query by `.eq('user_id', userId)`
- [ ] Never trusts input IDs without ownership check
- [ ] Returns `null` if not found OR not owned
- [ ] Applies to: findById, update, delete, stats queries

### Why This Matters

Without `user_id` filtering:
- Users could access other users' data
- Users could modify/delete others' resources
- Privacy and security are compromised
- Row-Level Security (RLS) is your backup, but don't rely on it alone

---

## Async Processing & Job Queue

### Architecture

POEPilot uses Supabase Realtime to implement a job queue for long-running operations like:
- Document ingestion and extraction
- Image generation
- Large file processing

### Job Queue Setup

**File**: `api/src/jobs/supabaseQueue.ts`

```typescript
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Job {
  id: string;
  type: 'ingestion' | 'image_generation' | 'processing';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payload: Record<string, any>;
  result?: any;
  error?: string;
  created_at: Date;
  updated_at: Date;
}

let channel: RealtimeChannel | null = null;

export async function initializeJobQueue() {
  console.log('🔄 Initializing job queue...');

  // Subscribe to job inserts
  channel = supabase
    .channel('jobs')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'jobs',
        filter: 'status=eq.pending',
      },
      (payload) => {
        handleNewJob(payload.new as Job);
      }
    )
    .subscribe();

  console.log('✅ Job queue initialized');
}

async function handleNewJob(job: Job) {
  console.log(`📝 New job: ${job.type} (${job.id})`);

  // Update status to processing
  await updateJobStatus(job.id, 'processing');

  try {
    // Route to appropriate processor
    let result;
    switch (job.type) {
      case 'ingestion':
        result = await processIngestion(job);
        break;
      case 'image_generation':
        result = await processImageGeneration(job);
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }

    // Mark as completed
    await updateJobStatus(job.id, 'completed', result);
  } catch (error) {
    console.error(`❌ Job failed: ${job.id}`, error);
    await updateJobStatus(job.id, 'failed', null, error.message);
  }
}

async function updateJobStatus(
  jobId: string,
  status: Job['status'],
  result?: any,
  error?: string
) {
  await supabase
    .from('jobs')
    .update({
      status,
      result,
      error,
      updated_at: new Date(),
    })
    .eq('id', jobId);
}
```

### Creating a Job

**From any service**:

```typescript
async createIngestionJob(projectId: string, fileUrl: string): Promise<string> {
  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      type: 'ingestion',
      status: 'pending',
      payload: {
        project_id: projectId,
        file_url: fileUrl,
      },
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create job: ${error.message}`);
  }

  return job.id;
}
```

### Monitoring Job Progress

**Frontend polls or uses WebSocket**:

```typescript
async getJobStatus(jobId: string): Promise<Job> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    throw new Error(`Failed to get job status: ${error.message}`);
  }

  return data;
}
```

---

## WebSocket Real-Time Communication

### WebSocket Setup

**File**: `api/src/websocket/index.ts`

```typescript
import { Server } from 'socket.io';
import { supabase } from '@/lib/supabase';

export function initializeWebSocket(io: Server) {
  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Validate token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return next(new Error('Invalid token'));
    }

    // Attach user to socket
    socket.data.user = {
      id: user.id,
      email: user.email,
    };

    next();
  });

  // Connection handling
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.data.user.email}`);

    // Subscribe to project
    socket.on('subscribe:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      console.log(`📡 User ${socket.data.user.id} subscribed to project ${projectId}`);
    });

    // Unsubscribe from project
    socket.on('unsubscribe:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.data.user.email}`);
    });
  });

  console.log('✅ WebSocket initialized');
}
```

### Emitting Progress Updates

**From job processors**:

```typescript
import { io } from '@/server';

async function processIngestion(job: Job) {
  const { project_id } = job.payload;

  // Emit progress update
  io.to(`project:${project_id}`).emit('ingestion:progress', {
    jobId: job.id,
    progress: 0,
    status: 'Starting extraction...',
  });

  // ... processing ...

  io.to(`project:${project_id}`).emit('ingestion:progress', {
    jobId: job.id,
    progress: 50,
    status: 'Extracting entities...',
  });

  // ... more processing ...

  io.to(`project:${project_id}`).emit('ingestion:complete', {
    jobId: job.id,
    result: extractedData,
  });
}
```

### Frontend WebSocket Client

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: accessToken,
  },
});

// Subscribe to project
socket.emit('subscribe:project', projectId);

// Listen for progress
socket.on('ingestion:progress', (data) => {
  console.log(`Progress: ${data.progress}% - ${data.status}`);
});

// Listen for completion
socket.on('ingestion:complete', (data) => {
  console.log('Ingestion complete!', data.result);
});
```

---

## Database Design & RLS

### Table Design Pattern

```sql
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Data fields
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  description TEXT,
  cover_url TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT books_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT books_author_not_empty CHECK (length(trim(author)) > 0),
  CONSTRAINT books_isbn_unique UNIQUE (project_id, isbn)
);

-- Indexes
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_project_id ON books(project_id);
CREATE INDEX idx_books_created_at ON books(created_at DESC);
CREATE INDEX idx_books_author ON books(author);

-- Full-text search index
CREATE INDEX idx_books_title_search ON books USING GIN (to_tsvector('english', title));
```

### Row-Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own books
CREATE POLICY "Users can view own books"
  ON books FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own books
CREATE POLICY "Users can create own books"
  ON books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own books
CREATE POLICY "Users can update own books"
  ON books FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own books
CREATE POLICY "Users can delete own books"
  ON books FOR DELETE
  USING (auth.uid() = user_id);
```

### Updated Timestamps Trigger

```sql
-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger on update
CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Testing Patterns

### Test Structure

```
api/tests/
├── unit/
│   ├── services/
│   │   └── book.service.test.ts
│   └── utils/
│       └── validation.test.ts
├── integration/
│   ├── domains/
│   │   └── books.test.ts
│   └── middleware/
│       └── auth.test.ts
└── e2e/
    └── books-flow.test.ts
```

### Unit Test Example (Service)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BookService } from '@/domains/books/books.service';
import { BookRepository } from '@/domains/books/books.repository';
import { BookNotFoundError } from '@/domains/books/books.errors';

describe('BookService', () => {
  let service: BookService;
  let repository: BookRepository;

  beforeEach(() => {
    repository = new BookRepository();
    service = new BookService(repository);
  });

  describe('getBookById', () => {
    it('should return book if found', async () => {
      const mockBook = {
        id: '123',
        user_id: 'user1',
        title: 'Test Book',
        author: 'Test Author',
      };

      vi.spyOn(repository, 'findById').mockResolvedValue(mockBook as any);

      const result = await service.getBookById('123', 'user1');

      expect(result).toEqual(mockBook);
      expect(repository.findById).toHaveBeenCalledWith('123', 'user1');
    });

    it('should throw BookNotFoundError if not found', async () => {
      vi.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(service.getBookById('123', 'user1')).rejects.toThrow(
        BookNotFoundError
      );
    });
  });
});
```

### Integration Test Example (API)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '@/index';

describe('Books API', () => {
  let authToken: string;
  let projectId: string;

  beforeAll(async () => {
    // Setup: Login and get auth token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    authToken = loginRes.body.data.access_token;

    // Create test project
    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Project' });

    projectId = projectRes.body.data.id;
  });

  describe('POST /api/books', () => {
    it('should create a new book', async () => {
      const res = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          project_id: projectId,
          title: 'Test Book',
          author: 'Test Author',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe('Test Book');
    });

    it('should return 400 for invalid data', async () => {
      const res = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          project_id: projectId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Validation error');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).post('/api/books').send({
        project_id: projectId,
        title: 'Test Book',
        author: 'Test Author',
      });

      expect(res.status).toBe(401);
    });
  });
});
```

---

## Common Tasks

### Adding a New API Endpoint

**Task**: Add a "mark book as favorite" endpoint

**1. Add type** (`books.types.ts`):
```typescript
export interface UpdateBookFavoriteDTO {
  is_favorite: boolean;
}
```

**2. Add schema** (`books.schemas.ts`):
```typescript
export const updateBookFavoriteSchema = z.object({
  params: z.object({
    bookId: z.string().uuid(),
  }),
  body: z.object({
    is_favorite: z.boolean(),
  }),
});
```

**3. Add repository method** (`books.repository.ts`):
```typescript
async updateFavorite(
  bookId: string,
  userId: string,
  isFavorite: boolean
): Promise<Book | null> {
  const { data, error } = await supabase
    .from(this.table)
    .update({ is_favorite: isFavorite, updated_at: new Date() })
    .eq('id', bookId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to update favorite: ${error.message}`);
  }

  return data as Book;
}
```

**4. Add service method** (`books.service.ts`):
```typescript
async updateBookFavorite(
  bookId: string,
  userId: string,
  isFavorite: boolean
): Promise<Book> {
  const updated = await this.repository.updateFavorite(
    bookId,
    userId,
    isFavorite
  );

  if (!updated) {
    throw new BookNotFoundError(bookId);
  }

  return updated;
}
```

**5. Add controller method** (`books.controller.ts`):
```typescript
async updateFavorite(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { bookId } = req.params;
    const { is_favorite } = req.body;
    const userId = req.user!.id;

    const book = await this.service.updateBookFavorite(
      bookId,
      userId,
      is_favorite
    );

    res.json({
      success: true,
      data: book,
      message: 'Favorite status updated',
    });
  } catch (error) {
    next(error);
  }
}
```

**6. Add route** (`books.routes.ts`):
```typescript
router.patch(
  '/:bookId/favorite',
  validateRequest(updateBookFavoriteSchema),
  asyncHandler(controller.updateFavorite.bind(controller))
);
```

Done! Endpoint available at `PATCH /api/books/:bookId/favorite`

---

## Troubleshooting

### Problem: Errors crash the server

**Symptom**: Server crashes on unhandled promise rejections

**Cause**: Route handler not wrapped with `asyncHandler`

**Solution**:
```typescript
// ❌ Wrong
router.get('/', async (req, res) => { ... });

// ✓ Correct
router.get('/', asyncHandler(async (req, res) => { ... }));
```

### Problem: Middleware not executing

**Symptom**: Auth middleware doesn't run, users not authenticated

**Cause**: Middleware order is wrong

**Solution**: Check middleware application order in `index.ts`:
```typescript
// Correct order:
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(conditionalAuthMiddleware); // Before routes
app.use('/api/books', bookRoutes);
app.use(errorHandler); // Last
```

### Problem: Validation always fails

**Symptom**: All requests return 400 validation errors

**Cause**: Schema structure doesn't match validation middleware

**Solution**: Ensure schema wraps body/params/query:
```typescript
// ✓ Correct
export const schema = z.object({
  body: z.object({ ... }),
  params: z.object({ ... }),
});

// ❌ Wrong
export const schema = z.object({
  name: z.string(), // Missing body wrapper
});
```

### Problem: BYPASS_AUTH not working

**Symptom**: Still getting 401 errors in development

**Cause**: Environment variable not loaded or NODE_ENV not set

**Solution**:
```bash
# .env
NODE_ENV=development
BYPASS_AUTH=true
```

Restart server after changing .env files.

### Problem: Can't access other user's resources

**Symptom**: 404 errors when trying to access resources by ID

**Cause**: Working as designed - user_id filtering is working

**Solution**: This is correct behavior! Users should only see their own data. If you need to access data across users (e.g., admin features), create separate admin endpoints with role checks.

---

## Summary

This guide covers every aspect of POEPilot's backend implementation:

✓ Complete middleware stack with execution order
✓ Environment configuration with all variables
✓ Full domain implementation pattern with real examples
✓ Authentication and authorization patterns
✓ Validation strategies with Zod
✓ Error handling flow
✓ Security patterns (user_id enforcement)
✓ Async processing with job queues
✓ WebSocket real-time communication
✓ Database design and RLS
✓ Testing patterns
✓ Common task guides
✓ Troubleshooting tips

Use this as your reference for all backend development in POEPilot.
