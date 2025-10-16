# POEPilot Development Standards and Patterns

This document contains all development standards, patterns, and conventions for the POEPilot project.

## Documentation Index

### Quick Reference
- **[QUICK_START.md](./QUICK_START.md)** - Get started fast with common tasks and step-by-step guides

### Complete Implementation Guides
- **[API_COMPLETE_GUIDE.md](./API_COMPLETE_GUIDE.md)** - Comprehensive backend patterns, middleware, configuration, security, and async processing
- **[UI_COMPLETE_GUIDE.md](./UI_COMPLETE_GUIDE.md)** - Complete frontend patterns, state management, hooks, routing, and components

### Pattern References
- **[api_pattern.md](./api_pattern.md)** - API architecture and domain implementation patterns
- **[ui_pattern.md](./ui_pattern.md)** - UI architecture and component patterns (to be created)

### Analysis & Context
- **[CODEBASE_ANALYSIS.md](./CODEBASE_ANALYSIS.md)** - Detailed analysis of actual implementation vs documentation

---

## Table of Contents

1. [API Design/Implementation Pattern](#api-designimplementation-pattern)
2. [Domain Implementation Pattern](#domain-implementation-pattern)
3. [Frontend UI Design/Implementation Pattern](#frontend-ui-designimplementation-pattern)
4. [User Authentication Pattern](#user-authentication-pattern)
5. [Bruno API REST Collection Guide](#bruno-api-rest-collection-guide)

---

## API Design/Implementation Pattern

The API is designed using Feature Slicing principles to ensure scalability, maintainability, and clear separation of concerns.

### Stack

- **Platform**: Node.js + Express.js
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **Language**: TypeScript
- **Package Manager**: bun (fallback to npm)
- **Architecture**: Feature Slicing

### Project Structure

```
api/
├── src/
│   ├── domains/           # Business domains (target structure)
│   │   ├── auth/         # Authentication domain
│   │   ├── projects/     # Projects management
│   │   ├── content/      # Content processing
│   │   ├── ingestion/    # Data ingestion
│   │   ├── chat/         # Chat completions
│   │   ├── braindump/    # Audio transcription
│   │   └── health/       # Health checks
│   ├── middleware/       # Cross-cutting concerns
│   ├── utils/           # Shared utilities
│   ├── config/          # Configuration
│   └── index.ts         # Entry point
├── tests/               # Test files
└── package.json
```

### Domain Structure Pattern

Each domain follows a consistent structure:

```
domains/[domain-name]/
├── index.ts              # Domain exports
├── routes.ts             # Express routes
├── controller.ts         # Request handling
├── service.ts            # Business logic
├── repository.ts         # Data access
├── schemas.ts            # Validation schemas
├── types.ts              # TypeScript types
└── errors.ts             # Domain-specific errors
```

### Key Middleware

- `auth.ts` - Authentication middleware for protected routes
- `errorHandler.ts` - Global error handling
- `validation.ts` - Request validation using Zod
- `rateLimiter.ts` - API rate limiting

### Conventions

- Use async/await for asynchronous operations
- Implement proper error handling with try-catch
- Validate all inputs using Zod schemas
- Return consistent response formats
- Use HTTP status codes appropriately
- Keep controllers thin, business logic in services

---

## Domain Implementation Pattern

### Overview

When implementing a new domain (feature area) within the API, follow this consistent pattern to maintain code organization and reusability.

### Directory Structure

```
src/domains/[domain-name]/
├── index.ts              # Public exports
├── routes.ts             # Express route definitions
├── controller.ts         # HTTP request handling
├── service.ts            # Business logic
├── repository.ts         # Data access layer
├── schemas.ts            # Zod validation schemas
├── types.ts              # TypeScript type definitions
└── errors.ts             # Domain-specific error classes
```

### Core Components

#### 1. Types (`types.ts`)

Define all TypeScript interfaces and types for the domain.

```typescript
// Base entity type
export interface [Entity] {
  id: string;
  created_at: Date;
  updated_at: Date;
  // ... domain-specific fields
}

// DTOs
export interface Create[Entity]DTO {
  // fields for creation
}

export interface Update[Entity]DTO {
  // fields for update
}
```

#### 2. Schemas (`schemas.ts`)

Define Zod schemas for validation. These should mirror your types.

```typescript
import { z } from 'zod';

export const create[Entity]Schema = z.object({
  // validation rules
});

export const update[Entity]Schema = z.object({
  // validation rules
});

// Export inferred types (DRY approach)
export type Create[Entity]Input = z.infer<typeof create[Entity]Schema>;
export type Update[Entity]Input = z.infer<typeof update[Entity]Schema>;
```

#### 3. Repository (`repository.ts`)

Handles all database operations. Uses Supabase client.

```typescript
import { supabase } from '@/lib/supabase';
import type { [Entity], Create[Entity]DTO, Update[Entity]DTO } from './types';

export class [Entity]Repository {
  async findAll(filters?: any): Promise<[Entity][]> {
    // Implementation
  }

  async findById(id: string): Promise<[Entity] | null> {
    // Implementation
  }

  async create(data: Create[Entity]DTO): Promise<[Entity]> {
    // Implementation
  }

  async update(id: string, data: Update[Entity]DTO): Promise<[Entity]> {
    // Implementation
  }

  async delete(id: string): Promise<void> {
    // Implementation
  }
}
```

#### 4. Service (`service.ts`)

Contains business logic. Orchestrates repository calls and implements domain rules.

```typescript
import { [Entity]Repository } from './repository';
import type { Create[Entity]DTO, Update[Entity]DTO } from './types';
import { [Entity]NotFoundError } from './errors';

export class [Entity]Service {
  constructor(private repository: [Entity]Repository) {}

  async get[Entities](filters?: any) {
    // Business logic + repository call
    return this.repository.findAll(filters);
  }

  async get[Entity]ById(id: string) {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new [Entity]NotFoundError(id);
    }
    return entity;
  }

  async create[Entity](data: Create[Entity]DTO) {
    // Validation, business rules
    return this.repository.create(data);
  }

  async update[Entity](id: string, data: Update[Entity]DTO) {
    // Validation, business rules
    return this.repository.update(id, data);
  }

  async delete[Entity](id: string) {
    await this.get[Entity]ById(id); // Ensure exists
    return this.repository.delete(id);
  }
}
```

#### 5. Controller (`controller.ts`)

Handles HTTP requests/responses. Thin layer that delegates to service.

```typescript
import { Request, Response } from 'express';
import { [Entity]Service } from './service';
import { create[Entity]Schema, update[Entity]Schema } from './schemas';

export class [Entity]Controller {
  constructor(private service: [Entity]Service) {}

  async getAll(req: Request, res: Response) {
    const entities = await this.service.get[Entities](req.query);
    res.json({ data: entities });
  }

  async getById(req: Request, res: Response) {
    const entity = await this.service.get[Entity]ById(req.params.id);
    res.json({ data: entity });
  }

  async create(req: Request, res: Response) {
    const data = create[Entity]Schema.parse(req.body);
    const entity = await this.service.create[Entity](data);
    res.status(201).json({ data: entity });
  }

  async update(req: Request, res: Response) {
    const data = update[Entity]Schema.parse(req.body);
    const entity = await this.service.update[Entity](req.params.id, data);
    res.json({ data: entity });
  }

  async delete(req: Request, res: Response) {
    await this.service.delete[Entity](req.params.id);
    res.status(204).send();
  }
}
```

#### 6. Routes (`routes.ts`)

Defines Express routes for the domain.

```typescript
import { Router } from 'express';
import { [Entity]Controller } from './controller';
import { [Entity]Service } from './service';
import { [Entity]Repository } from './repository';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { create[Entity]Schema, update[Entity]Schema } from './schemas';

const router = Router();

// Initialize layers
const repository = new [Entity]Repository();
const service = new [Entity]Service(repository);
const controller = new [Entity]Controller(service);

// Define routes
router.get('/', authenticate, controller.getAll.bind(controller));
router.get('/:id', authenticate, controller.getById.bind(controller));
router.post('/', authenticate, validate(create[Entity]Schema), controller.create.bind(controller));
router.patch('/:id', authenticate, validate(update[Entity]Schema), controller.update.bind(controller));
router.delete('/:id', authenticate, controller.delete.bind(controller));

export default router;
```

#### 7. Errors (`errors.ts`)

Domain-specific error classes.

```typescript
export class [Entity]NotFoundError extends Error {
  constructor(id: string) {
    super(`[Entity] with id ${id} not found`);
    this.name = '[Entity]NotFoundError';
  }
}

export class [Entity]ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = '[Entity]ValidationError';
  }
}
```

#### 8. Index (`index.ts`)

Public exports from the domain.

```typescript
export * from './types';
export * from './schemas';
export * from './service';
export * from './errors';
export { default as [entity]Routes } from './routes';
```

### Key Principles

1. **Separation of Concerns**: Each layer has a specific responsibility
2. **Dependency Injection**: Services receive repositories via constructor
3. **Error Handling**: Use domain-specific errors for better debugging
4. **Validation**: Always validate input data using Zod schemas
5. **Type Safety**: Use TypeScript interfaces throughout
6. **DRY**: Define types once, infer from Zod schemas where possible

### Benefits

- Consistent code organization across all domains
- Easy to test each layer independently
- Clear separation between HTTP handling and business logic
- Reusable patterns reduce development time
- Type-safe from routes to database

### Example: Projects Domain

Here's how the pattern applies to the `projects` domain in POEPilot:

```typescript
// projects/types.ts
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// projects/schemas.ts
export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  settings: z.record(z.any()).default({}),
});

// projects/service.ts
export class ProjectService {
  async getProjects(userId: string) {
    return this.repository.findByUserId(userId);
  }

  async createProject(userId: string, data: CreateProjectDTO) {
    return this.repository.create({ ...data, user_id: userId });
  }
}
```

---

## Frontend UI Design/Implementation Pattern

### Stack

- **Framework**: React (via Vite)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Location**: All frontend code is in the `@ui` folder

### Key Principles

- Use Tailwind CSS for all styling (no custom CSS unless absolutely necessary)
- Implement animations and transitions using Framer Motion
- Component-based architecture
- Responsive design first
- Accessibility considerations

---

## User Authentication Pattern

### Overview

Authentication is handled using Supabase for both frontend and backend, with a clear separation of concerns.

### Frontend Authentication (UI)

- Uses Supabase SDK directly
- Handles login, signup, and session management
- Stores auth tokens in Supabase's managed storage
- Automatic token refresh

### Backend Authentication (API)

- Verifies Supabase JWT tokens on protected routes
- Extracts user information from validated tokens
- Manages user profile data in PostgreSQL

### Authentication Flow

#### 1. Login/Signup (Frontend)

```typescript
// UI: Login with Supabase
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

#### 2. API Request (Frontend)

```typescript
// UI: Make authenticated request
const response = await fetch("/api/resource", {
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
});
```

#### 3. Token Verification (Backend)

```typescript
// API: Verify token in middleware
export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Authentication failed" });
  }
}
```

### Protected Route Lifecycle

1. **Frontend**: User logs in via Supabase Auth
2. **Frontend**: Receives access token and refresh token
3. **Frontend**: Includes access token in API requests
4. **Backend**: Middleware validates token with Supabase
5. **Backend**: Attaches user object to request
6. **Backend**: Route handler has access to authenticated user

### Directory Structure

#### Frontend (UI)

```
ui/src/
├── components/
│   └── auth/
│       ├── LoginForm.tsx
│       ├── SignupForm.tsx
│       └── AuthGuard.tsx
├── hooks/
│   └── useAuth.ts
└── lib/
    └── supabase.ts
```

#### Backend (API)

```
api/src/
├── middleware/
│   └── auth.ts
└── domains/
    └── auth/
        ├── routes.ts
        ├── controller.ts
        ├── service.ts
        └── types.ts
```

### Key Components

#### Frontend: Auth Hook

```typescript
// ui/src/hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
```

#### Backend: Auth Middleware

```typescript
// api/src/middleware/auth.ts
import { supabase } from "@/lib/supabase";

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.substring(7);

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata,
    };

    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
}
```

### Best Practices

1. **Never trust the client**: Always verify tokens on the backend
2. **Use HTTPS**: Ensure tokens are transmitted securely
3. **Handle token expiration**: Implement proper refresh logic
4. **Secure sensitive routes**: Apply auth middleware to protected endpoints
5. **Store minimal user data**: Keep sensitive info in the backend only

---

## Bruno API REST Collection Guide

### Overview

Bruno is used as the API testing tool (alternative to Postman). Collections are stored as `.bru` files in the repository.

### Directory Structure

```
api/bruno-collection/
├── auth/
│   ├── login.bru
│   └── signup.bru
├── projects/
│   ├── list-projects.bru
│   ├── get-project.bru
│   ├── create-project.bru
│   ├── update-project.bru
│   └── delete-project.bru
└── environments/
    ├── local.bru
    └── staging.bru
```

### Bruno File Examples

#### GET Request

```bruno
meta {
  name: List Projects
  type: http
  seq: 1
}

get {
  url: {{baseUrl}}/api/projects
  body: none
  auth: bearer
}

auth:bearer {
  token: {{authToken}}
}

headers {
  Content-Type: application/json
}

docs {
  # List Projects

  Retrieves all projects for the authenticated user.

  ## Response
  - 200: Success with projects array
  - 401: Unauthorized
}
```

#### POST Request

```bruno
meta {
  name: Create Project
  type: http
  seq: 2
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
    "name": "My New Project",
    "description": "A test project",
    "settings": {
      "public": false
    }
  }
}

docs {
  # Create Project

  Creates a new project for the authenticated user.

  ## Request Body
  - name: string (required)
  - description: string (optional)
  - settings: object (optional)

  ## Response
  - 201: Created with project data
  - 400: Bad request
  - 401: Unauthorized
}
```

#### PATCH Request

```bruno
meta {
  name: Update Project
  type: http
  seq: 3
}

patch {
  url: {{baseUrl}}/api/projects/:id
  body: json
  auth: bearer
}

params:path {
  id: {{projectId}}
}

auth:bearer {
  token: {{authToken}}
}

headers {
  Content-Type: application/json
}

body:json {
  {
    "name": "Updated Project Name",
    "description": "Updated description"
  }
}

docs {
  # Update Project

  Updates an existing project.

  ## Path Parameters
  - id: Project ID

  ## Request Body
  All fields are optional:
  - name: string
  - description: string
  - settings: object

  ## Response
  - 200: Success with updated project
  - 400: Bad request
  - 401: Unauthorized
  - 404: Project not found
}
```

#### DELETE Request

```bruno
meta {
  name: Delete Project
  type: http
  seq: 4
}

delete {
  url: {{baseUrl}}/api/projects/:id
  body: none
  auth: bearer
}

params:path {
  id: {{projectId}}
}

auth:bearer {
  token: {{authToken}}
}

docs {
  # Delete Project

  Deletes a project permanently.

  ## Path Parameters
  - id: Project ID

  ## Response
  - 204: No content (success)
  - 401: Unauthorized
  - 404: Project not found
}
```

#### Environment File

```bruno
vars {
  baseUrl: http://localhost:3001
  authToken: your-auth-token-here
  projectId: sample-project-id
}

vars:secret [
  authToken
]
```

### Best Practices

1. **Organize by domain**: Group related endpoints in folders
2. **Use environments**: Separate configs for local, staging, production
3. **Document requests**: Add descriptions in the docs section
4. **Version control**: Commit .bru files to track API changes
5. **Use variables**: Don't hardcode URLs or tokens
6. **Test flows**: Create request sequences for common workflows

### Running Tests

```bash
# Run all tests
bruno run api/bruno-collection

# Run specific folder
bruno run api/bruno-collection/projects

# Run with specific environment
bruno run api/bruno-collection --env local
```

---

## Additional Notes

### Development Commands

- **Start development**: `npm run dev` (from root)
- **Start API only**: `cd api && npm run dev`
- **Start UI only**: `cd ui && npm run dev`
- **Run tests**: `npm test`
- **Lint code**: `npm run lint`

### Environment Variables

- Check `.env.example` files in both `api/` and `ui/` directories
- Never commit `.env` files
- Use `.env.local` for local development overrides

### Git Workflow

- Feature branches: `feat/feature-name`
- Bug fixes: `fix/bug-description`
- Hotfixes: `hotfix/critical-issue`
- Always create PRs for code review

### Testing Strategy

- Unit tests for services and utilities
- Integration tests for API endpoints
- E2E tests for critical user flows
- Maintain >80% code coverage
