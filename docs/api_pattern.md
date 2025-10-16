# POEPilot API Implementation Pattern

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Philosophy](#architecture-philosophy)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Domain-Driven Design](#domain-driven-design)
6. [Layer Responsibilities](#layer-responsibilities)
7. [Implementation Guidelines](#implementation-guidelines)
8. [Authentication & Authorization](#authentication--authorization)
9. [Error Handling](#error-handling)
10. [Validation Strategy](#validation-strategy)
11. [Database Design](#database-design)
12. [API Testing with Bruno](#api-testing-with-bruno)
13. [Development Workflow](#development-workflow)
14. [Best Practices](#best-practices)

---

## System Overview

POEPilot API is a Node.js/Express backend service that provides RESTful endpoints for managing projects, content processing, chat completions, and audio transcription. The system is built on **Feature Slicing** principles with a focus on domain-driven design, ensuring each business domain is self-contained and maintainable.

### Core Capabilities

- **Authentication**: Supabase-based JWT authentication
- **Project Management**: CRUD operations for user projects
- **Content Processing**: Document ingestion and processing
- **Chat Completions**: AI-powered chat interactions
- **Audio Transcription**: Brain dump audio processing
- **Health Monitoring**: System health checks and diagnostics

---

## Architecture Philosophy

### Feature Slicing

The API follows **Feature Slicing** architecture where code is organized by business domains rather than technical layers. This approach:

- **Promotes autonomy**: Each domain can evolve independently
- **Enhances discoverability**: Related code lives together
- **Simplifies testing**: Domain boundaries are clear
- **Improves maintainability**: Changes are localized

### Layered Architecture within Domains

Within each domain, we maintain a clear separation of concerns:

```
Request → Route → Controller → Service → Repository → Database
```

Each layer has a specific responsibility and communicates only with adjacent layers.

### Dependency Injection

Services receive their dependencies (repositories, other services) via constructor injection, making the codebase:

- **Testable**: Easy to mock dependencies
- **Flexible**: Easy to swap implementations
- **Explicit**: Dependencies are clearly visible

---

## Technology Stack

### Core Technologies

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **Package Manager**: bun (with npm fallback)

### Backend Services

- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **ORM**: Direct Supabase client (no heavy ORM)

### Development Tools

- **Validation**: Zod
- **Testing**: Jest / Vitest
- **API Testing**: Bruno
- **Linting**: ESLint
- **Formatting**: Prettier

---

## Project Structure

```
api/
├── src/
│   ├── domains/              # Business domains (feature slices)
│   │   ├── auth/            # Authentication & authorization
│   │   │   ├── index.ts
│   │   │   ├── routes.ts
│   │   │   ├── controller.ts
│   │   │   ├── service.ts
│   │   │   ├── repository.ts
│   │   │   ├── schemas.ts
│   │   │   ├── types.ts
│   │   │   └── errors.ts
│   │   ├── projects/        # Project management
│   │   ├── content/         # Content processing
│   │   ├── ingestion/       # Data ingestion
│   │   ├── chat/            # Chat completions
│   │   ├── braindump/       # Audio transcription
│   │   └── health/          # Health monitoring
│   ├── middleware/          # Cross-cutting concerns
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── validation.ts
│   │   └── rateLimiter.ts
│   ├── utils/              # Shared utilities
│   │   ├── logger.ts
│   │   ├── response.ts
│   │   └── constants.ts
│   ├── config/             # Configuration management
│   │   ├── database.ts
│   │   ├── environment.ts
│   │   └── supabase.ts
│   ├── lib/                # External service clients
│   │   └── supabase.ts
│   └── index.ts            # Application entry point
├── tests/                  # Test files (mirrors src/)
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── bruno-collection/       # Bruno API tests
│   ├── auth/
│   ├── projects/
│   └── environments/
├── .env.example
├── .env
├── tsconfig.json
└── package.json
```

---

## Domain-Driven Design

### Standard Domain Structure

Every domain follows this consistent structure:

```
domains/[domain-name]/
├── index.ts              # Public API exports
├── routes.ts             # Express route definitions
├── controller.ts         # HTTP request/response handling
├── service.ts            # Business logic orchestration
├── repository.ts         # Data access layer
├── schemas.ts            # Zod validation schemas
├── types.ts              # TypeScript type definitions
└── errors.ts             # Domain-specific error classes
```

### File Responsibilities

#### `types.ts` - Type Definitions

Contains all TypeScript interfaces and types for the domain.

```typescript
// Base entity
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// Data Transfer Objects
export interface CreateProjectDTO {
  name: string;
  description?: string;
  settings?: Record<string, any>;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  settings?: Record<string, any>;
}

// Query filters
export interface ProjectFilters {
  search?: string;
  limit?: number;
  offset?: number;
}
```

#### `schemas.ts` - Validation Schemas

Defines Zod schemas for runtime validation. Schemas should mirror types.

```typescript
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional(),
  settings: z.record(z.any()).default({}),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  settings: z.record(z.any()).optional(),
});

export const projectFiltersSchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

// Export inferred types (DRY principle)
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectFiltersInput = z.infer<typeof projectFiltersSchema>;
```

#### `errors.ts` - Domain Errors

Custom error classes for domain-specific error handling.

```typescript
export class ProjectNotFoundError extends Error {
  public readonly statusCode = 404;

  constructor(projectId: string) {
    super(`Project with id ${projectId} not found`);
    this.name = 'ProjectNotFoundError';
    Object.setPrototypeOf(this, ProjectNotFoundError.prototype);
  }
}

export class ProjectValidationError extends Error {
  public readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ProjectValidationError';
    Object.setPrototypeOf(this, ProjectValidationError.prototype);
  }
}

export class ProjectAuthorizationError extends Error {
  public readonly statusCode = 403;

  constructor(message: string = 'Unauthorized to access this project') {
    super(message);
    this.name = 'ProjectAuthorizationError';
    Object.setPrototypeOf(this, ProjectAuthorizationError.prototype);
  }
}
```

#### `repository.ts` - Data Access Layer

Handles all database operations using Supabase client.

```typescript
import { supabase } from '@/lib/supabase';
import type {
  Project,
  CreateProjectDTO,
  UpdateProjectDTO,
  ProjectFilters
} from './types';

export class ProjectRepository {
  private readonly table = 'projects';

  async findAll(filters: ProjectFilters = {}): Promise<Project[]> {
    let query = supabase
      .from(this.table)
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    return data as Project[];
  }

  async findById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch project: ${error.message}`);
    }

    return data as Project;
  }

  async findByUserId(userId: string, filters: ProjectFilters = {}): Promise<Project[]> {
    let query = supabase
      .from(this.table)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch user projects: ${error.message}`);
    }

    return data as Project[];
  }

  async create(data: CreateProjectDTO & { user_id: string }): Promise<Project> {
    const { data: project, error } = await supabase
      .from(this.table)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }

    return project as Project;
  }

  async update(id: string, data: UpdateProjectDTO): Promise<Project> {
    const { data: project, error } = await supabase
      .from(this.table)
      .update({ ...data, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }

    return project as Project;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  async exists(id: string): Promise<boolean> {
    const { count, error } = await supabase
      .from(this.table)
      .select('id', { count: 'exact', head: true })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to check project existence: ${error.message}`);
    }

    return (count ?? 0) > 0;
  }
}
```

#### `service.ts` - Business Logic

Orchestrates repository calls and implements business rules.

```typescript
import { ProjectRepository } from './repository';
import type {
  Project,
  CreateProjectDTO,
  UpdateProjectDTO,
  ProjectFilters
} from './types';
import {
  ProjectNotFoundError,
  ProjectValidationError,
  ProjectAuthorizationError,
} from './errors';

export class ProjectService {
  constructor(private readonly repository: ProjectRepository) {}

  async getProjects(filters: ProjectFilters = {}): Promise<Project[]> {
    return this.repository.findAll(filters);
  }

  async getProjectById(id: string, userId?: string): Promise<Project> {
    const project = await this.repository.findById(id);

    if (!project) {
      throw new ProjectNotFoundError(id);
    }

    // Authorization check
    if (userId && project.user_id !== userId) {
      throw new ProjectAuthorizationError();
    }

    return project;
  }

  async getUserProjects(userId: string, filters: ProjectFilters = {}): Promise<Project[]> {
    return this.repository.findByUserId(userId, filters);
  }

  async createProject(userId: string, data: CreateProjectDTO): Promise<Project> {
    // Business validation
    if (!data.name || data.name.trim().length === 0) {
      throw new ProjectValidationError('Project name cannot be empty');
    }

    // Apply default settings
    const projectData = {
      ...data,
      user_id: userId,
      settings: data.settings || { public: false, theme: 'default' },
    };

    return this.repository.create(projectData);
  }

  async updateProject(
    id: string,
    userId: string,
    data: UpdateProjectDTO
  ): Promise<Project> {
    // Ensure project exists and user has access
    await this.getProjectById(id, userId);

    // Business validation
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new ProjectValidationError('Project name cannot be empty');
    }

    return this.repository.update(id, data);
  }

  async deleteProject(id: string, userId: string): Promise<void> {
    // Ensure project exists and user has access
    await this.getProjectById(id, userId);

    return this.repository.delete(id);
  }

  async projectExists(id: string): Promise<boolean> {
    return this.repository.exists(id);
  }
}
```

#### `controller.ts` - HTTP Handler

Handles HTTP requests and responses. Delegates to service layer.

```typescript
import { Request, Response, NextFunction } from 'express';
import { ProjectService } from './service';
import {
  createProjectSchema,
  updateProjectSchema,
  projectFiltersSchema,
} from './schemas';

export class ProjectController {
  constructor(private readonly service: ProjectService) {}

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = projectFiltersSchema.parse(req.query);
      const projects = await this.service.getProjects(filters);

      res.json({
        success: true,
        data: projects,
        meta: {
          count: projects.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const project = await this.service.getProjectById(id, userId);

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const filters = projectFiltersSchema.parse(req.query);

      const projects = await this.service.getUserProjects(userId, filters);

      res.json({
        success: true,
        data: projects,
        meta: {
          count: projects.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = createProjectSchema.parse(req.body);

      const project = await this.service.createProject(userId, data);

      res.status(201).json({
        success: true,
        data: project,
        message: 'Project created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const data = updateProjectSchema.parse(req.body);

      const project = await this.service.updateProject(id, userId, data);

      res.json({
        success: true,
        data: project,
        message: 'Project updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await this.service.deleteProject(id, userId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
```

#### `routes.ts` - Route Definitions

Defines Express routes and wires up dependencies.

```typescript
import { Router } from 'express';
import { ProjectController } from './controller';
import { ProjectService } from './service';
import { ProjectRepository } from './repository';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import {
  createProjectSchema,
  updateProjectSchema,
  projectFiltersSchema,
} from './schemas';

const router = Router();

// Initialize layers (dependency injection)
const repository = new ProjectRepository();
const service = new ProjectService(repository);
const controller = new ProjectController(service);

// Public routes (if any)
// router.get('/public', controller.getPublicProjects.bind(controller));

// Protected routes
router.get(
  '/',
  authenticate,
  validate(projectFiltersSchema, 'query'),
  controller.getUserProjects.bind(controller)
);

router.get(
  '/:id',
  authenticate,
  controller.getById.bind(controller)
);

router.post(
  '/',
  authenticate,
  validate(createProjectSchema),
  controller.create.bind(controller)
);

router.patch(
  '/:id',
  authenticate,
  validate(updateProjectSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authenticate,
  controller.delete.bind(controller)
);

export default router;
```

#### `index.ts` - Public Exports

Defines the public API of the domain.

```typescript
// Types
export * from './types';
export * from './schemas';

// Services (for use by other domains)
export { ProjectService } from './service';
export { ProjectRepository } from './repository';

// Errors (for error handling)
export * from './errors';

// Routes (for mounting in main app)
export { default as projectRoutes } from './routes';
```

---

## Layer Responsibilities

### 1. Routes Layer

**Purpose**: Define HTTP endpoints and wire up middleware

**Responsibilities**:
- Define URL paths and HTTP methods
- Apply middleware (auth, validation, rate limiting)
- Initialize and connect layers
- Bind controller methods to routes

**Should NOT**:
- Contain business logic
- Access database directly
- Handle errors (let middleware handle it)

### 2. Controller Layer

**Purpose**: Handle HTTP requests and responses

**Responsibilities**:
- Extract data from request (params, query, body)
- Parse and validate input using schemas
- Call service layer methods
- Format responses
- Pass errors to error handling middleware

**Should NOT**:
- Contain business logic
- Access database directly
- Make decisions based on business rules

### 3. Service Layer

**Purpose**: Implement business logic and orchestrate operations

**Responsibilities**:
- Implement business rules and validation
- Coordinate repository calls
- Handle domain logic and workflows
- Throw domain-specific errors
- Compose complex operations

**Should NOT**:
- Know about HTTP (Request/Response)
- Construct SQL queries
- Handle database connections

### 4. Repository Layer

**Purpose**: Abstract data access

**Responsibilities**:
- Execute database queries
- Map database results to domain types
- Handle database errors
- Provide data access methods

**Should NOT**:
- Implement business logic
- Throw domain-specific errors (except data access errors)
- Know about HTTP or business workflows

---

## Implementation Guidelines

### Creating a New Domain

**Step 1**: Create domain folder structure

```bash
mkdir -p src/domains/[domain-name]
cd src/domains/[domain-name]
touch index.ts routes.ts controller.ts service.ts repository.ts schemas.ts types.ts errors.ts
```

**Step 2**: Define types (`types.ts`)

Start with the core entity and DTOs.

**Step 3**: Create validation schemas (`schemas.ts`)

Mirror your types with Zod schemas.

**Step 4**: Implement repository (`repository.ts`)

Add basic CRUD operations.

**Step 5**: Implement service (`service.ts`)

Add business logic and orchestration.

**Step 6**: Implement controller (`controller.ts`)

Handle HTTP request/response.

**Step 7**: Define routes (`routes.ts`)

Wire everything together.

**Step 8**: Export public API (`index.ts`)

Expose what other domains need.

**Step 9**: Register routes in main app

```typescript
// src/index.ts
import { domainRoutes } from '@/domains/[domain-name]';
app.use('/api/[domain-name]', domainRoutes);
```

### Code Organization Principles

1. **Single Responsibility**: Each file should have one clear purpose
2. **Dependency Direction**: Dependencies flow inward (Controller → Service → Repository)
3. **Explicit Dependencies**: Use constructor injection
4. **Fail Fast**: Validate early and throw specific errors
5. **Immutability**: Prefer const and readonly
6. **Type Safety**: Use TypeScript's strict mode

---

## Authentication & Authorization

### Overview

Authentication is handled via Supabase JWT tokens. The auth middleware verifies tokens and attaches user information to requests.

### Auth Middleware

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { supabase } from '@/lib/supabase';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    metadata: Record<string, any>;
  };
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7);

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

    // Attach user to request
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

**Resource Ownership Check**:

```typescript
// In service layer
async getProjectById(id: string, userId?: string): Promise<Project> {
  const project = await this.repository.findById(id);

  if (!project) {
    throw new ProjectNotFoundError(id);
  }

  // Check ownership
  if (userId && project.user_id !== userId) {
    throw new ProjectAuthorizationError();
  }

  return project;
}
```

**Role-Based Access**:

```typescript
// Custom middleware
export function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.user.metadata.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Usage
router.delete('/:id', authenticate, requireRole('admin'), controller.delete.bind(controller));
```

---

## Error Handling

### Global Error Handler

```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.errors,
    });
    return;
  }

  // Domain-specific errors
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
    return;
  }

  // Default server error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}
```

### Error Hierarchy

```typescript
// Base error class
export class DomainError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Specific error types
export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 404);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthorizationError extends DomainError {
  constructor(message: string = 'Unauthorized') {
    super(message, 403);
  }
}
```

---

## Validation Strategy

### Input Validation

Use Zod schemas for all input validation:

```typescript
// Middleware for validation
export function validate(schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (error) {
      next(error);
    }
  };
}
```

### Schema Patterns

**Required vs Optional**:

```typescript
export const createSchema = z.object({
  name: z.string().min(1), // Required
  description: z.string().optional(), // Optional
  settings: z.record(z.any()).default({}), // Optional with default
});

export const updateSchema = z.object({
  name: z.string().min(1).optional(), // Everything optional in updates
  description: z.string().optional(),
  settings: z.record(z.any()).optional(),
});
```

**Complex Validation**:

```typescript
export const projectSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name too long')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid characters'),

  email: z.string().email('Invalid email'),

  age: z.number()
    .int('Must be integer')
    .positive('Must be positive')
    .max(120, 'Invalid age'),

  settings: z.object({
    public: z.boolean().default(false),
    theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  }),
});
```

---

## Database Design

### Schema Organization

```sql
-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT projects_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
```

### Row-Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can only see their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own projects
CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);
```

---

## API Testing with Bruno

### Collection Structure

```
bruno-collection/
├── environments/
│   ├── local.bru
│   ├── staging.bru
│   └── production.bru
├── auth/
│   ├── login.bru
│   ├── signup.bru
│   └── refresh.bru
└── projects/
    ├── list-projects.bru
    ├── get-project.bru
    ├── create-project.bru
    ├── update-project.bru
    └── delete-project.bru
```

### Example Bruno Request

```bruno
meta {
  name: Create Project
  type: http
  seq: 1
}

post {
  url: {{baseUrl}}/api/projects
  body: json
  auth: bearer
}

auth:bearer {
  token: {{authToken}}
}

headers {
  Content-Type: application/json
}

body:json {
  {
    "name": "Test Project",
    "description": "A test project for API validation",
    "settings": {
      "public": false
    }
  }
}

tests {
  test("Status code is 201", function() {
    expect(res.status).to.equal(201);
  });

  test("Response has success flag", function() {
    expect(res.body.success).to.be.true;
  });

  test("Response contains project data", function() {
    expect(res.body.data).to.have.property('id');
    expect(res.body.data.name).to.equal('Test Project');
  });
}

docs {
  # Create Project

  Creates a new project for the authenticated user.

  ## Request Body
  - `name` (string, required): Project name (1-255 chars)
  - `description` (string, optional): Project description
  - `settings` (object, optional): Project settings

  ## Response
  - **201**: Project created successfully
  - **400**: Validation error
  - **401**: Unauthorized
}
```

---

## Development Workflow

### Local Development

```bash
# Install dependencies
bun install

# Setup environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run migrations (if using local Supabase)
npx supabase db reset

# Start development server
bun run dev

# Run tests
bun test

# Run linter
bun run lint

# Type check
bun run type-check
```

### Testing Strategy

1. **Unit Tests**: Test individual functions and methods
2. **Integration Tests**: Test domain interactions and database operations
3. **E2E Tests**: Test complete request/response cycles
4. **Manual Tests**: Use Bruno for exploratory testing

---

## Best Practices

### Code Quality

- **Use TypeScript strict mode**: Catch errors at compile time
- **Prefer immutability**: Use `const` and `readonly`
- **Async/await over callbacks**: Modern async handling
- **Early returns**: Reduce nesting
- **Meaningful names**: Variables and functions should be self-documenting

### Security

- **Never trust client input**: Always validate
- **Use parameterized queries**: Prevent SQL injection
- **Implement rate limiting**: Prevent abuse
- **Log security events**: Monitor for suspicious activity
- **Keep dependencies updated**: Patch vulnerabilities

### Performance

- **Use database indexes**: Speed up queries
- **Implement pagination**: Don't return huge datasets
- **Cache when appropriate**: Reduce database load
- **Use connection pooling**: Efficient database connections
- **Monitor query performance**: Optimize slow queries

### Maintainability

- **Write tests**: Make refactoring safe
- **Document complex logic**: Explain the "why"
- **Keep functions small**: Single responsibility
- **Use consistent patterns**: Follow domain structure
- **Review code regularly**: Catch issues early

---

## Summary

The POEPilot API architecture prioritizes:

1. **Clear separation of concerns** through layered architecture
2. **Domain-driven design** for business logic organization
3. **Type safety** with TypeScript
4. **Validation** using Zod schemas
5. **Testability** through dependency injection
6. **Security** with proper authentication and authorization
7. **Maintainability** with consistent patterns

By following these patterns, the API remains scalable, maintainable, and easy to understand for new developers.
