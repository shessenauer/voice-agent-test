# ADR-001: Monorepo Structure

## Status

Accepted

## Context

The current codebase is a monolithic Next.js application with all code in a single `src/` directory. As the application grows, we need better organization to:

1. **Separate concerns**: UI components, business logic, and shared utilities are mixed together
2. **Enable team scaling**: Multiple developers working on different parts without conflicts
3. **Improve maintainability**: Clear boundaries between different architectural layers
4. **Support future growth**: Easy to add new packages (mobile app, CLI tools, worker services)
5. **Better testing**: Each package can be tested independently
6. **Type safety**: Shared types ensure contracts between layers

Current issues:

- Agent configurations are in `src/app/agentConfigs/` (should be business logic)
- MCP library is in `src/lib/mcp/` (should be core service)
- API routes and UI components are mixed in `src/app/`
- Types and schemas are scattered across the codebase
- No clear separation between client-side and server-side code

## Decision

We will restructure the codebase into a **monorepo with npm workspaces** using the following architecture:

### Package Structure

1. **@samos/ui** - Next.js frontend with API routes (hybrid approach)
   - Contains React components, pages, and Next.js API routes
   - Handles user interface and HTTP API endpoints
   - Imports from @samos/core for business logic

2. **@samos/core** - Business logic layer
   - Contains agent configurations, MCP services, and business logic
   - Provides services consumed by UI package API routes
   - Handles external API integrations (GitHub, Google, etc.)

3. **@samos/shared** - Shared code
   - Contains types, schemas, utilities, and constants
   - Used by both UI and Core packages
   - Ensures type safety across package boundaries

4. **supabase/** - Top-level Supabase configuration
   - Shared configuration for auth and database access
   - Used by both UI (auth) and Core (database) packages

### Why Monorepo vs Alternatives

**Alternatives Considered:**

1. **Keep Monolith** - Rejected because:
   - No clear separation of concerns
   - Difficult to scale team development
   - Hard to test individual components
   - No type safety between layers

2. **Microservices** - Rejected because:
   - Over-engineering for current scale
   - Complex deployment and networking
   - Difficult to maintain type safety across services
   - Unnecessary operational overhead

3. **Separate Repositories** - Rejected because:
   - Difficult to maintain shared types
   - Complex dependency management
   - Harder to coordinate changes across packages
   - More complex CI/CD setup

**Why Monorepo:**

- Clear package boundaries with shared types
- Single repository for easier coordination
- npm workspaces for dependency management
- Turborepo for efficient builds and caching
- Easy to add new packages as needed

### Why Hybrid API Approach

Instead of moving to a separate Express server, we're keeping Next.js API routes because:

1. **Simpler deployment** - Single application to deploy
2. **Type safety** - Direct imports from @samos/core
3. **Performance** - No network overhead between UI and API
4. **Development experience** - Single dev server
5. **Existing investment** - API routes already work well

The API routes will import and use services from @samos/core, providing clear separation while maintaining simplicity.

## Consequences

### Positive

1. **Clear Architecture**: Each package has a single responsibility
2. **Type Safety**: Shared types ensure contracts between packages
3. **Independent Testing**: Each package can be tested in isolation
4. **Team Scalability**: Multiple developers can work on different packages
5. **Future Growth**: Easy to add new packages (mobile, CLI, workers)
6. **Better Documentation**: Package boundaries force better documentation
7. **Build Optimization**: Turborepo enables efficient caching and parallel builds

### Negative

1. **Initial Complexity**: Migration requires significant refactoring
2. **Learning Curve**: Team needs to understand new structure
3. **Build Setup**: More complex build configuration
4. **Import Management**: Need to manage cross-package dependencies carefully

### Mitigation Strategies

1. **Gradual Migration**: Move packages one at a time
2. **Comprehensive Documentation**: ADRs and inline docs explain decisions
3. **TypeScript**: Compile-time checks prevent import errors
4. **Turborepo**: Handles build complexity automatically
5. **Clear Guidelines**: Documentation on how to add new packages

## Alternatives Considered

1. **Keep Current Structure** - Rejected due to scalability issues
2. **Microservices Architecture** - Rejected as over-engineering
3. **Separate Repositories** - Rejected due to complexity
4. **Full API Separation** - Rejected in favor of hybrid approach

## Implementation Plan

1. **Phase 0**: Analysis and setup
2. **Phase 1**: Monorepo foundation with Turborepo
3. **Phase 2**: Shared package with types and schemas
4. **Phase 3**: Supabase top-level configuration
5. **Phase 4**: Core package with business logic
6. **Phase 5**: UI package with Next.js app
7. **Phase 6**: TypeScript configuration updates
8. **Phase 7**: Documentation and linting setup
9. **Phase 8**: Environment configuration
10. **Phase 9**: Comprehensive documentation
11. **Phase 10**: Testing strategy
12. **Phase 11**: Migration execution
13. **Phase 12**: Post-migration optimization

## References

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [npm Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Monorepo Best Practices](https://monorepo.tools/)

## Decision Date

2024-01-15

## Review Date

2024-04-15 (3 months)
