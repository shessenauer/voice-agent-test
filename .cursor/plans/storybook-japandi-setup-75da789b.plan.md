<!-- 75da789b-5e44-49c4-a8d1-6414797a58fc be589d9a-237d-4071-9c65-cd8f8d5a41dd -->
# Storybook Setup with Japandi Design System

## Phase 1: Project Configuration & Dependencies

### Install Storybook and Dependencies

- Install Storybook 8.x for Next.js with TypeScript support
- Install shadcn/ui CLI and configure for the project
- Add required dependencies: `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui` packages
- Install Storybook addons: `@storybook/addon-themes`, `@storybook/addon-a11y`

### Configure Storybook

- Create `.storybook/main.ts` with Next.js framework configuration
- Create `.storybook/preview.tsx` with Japandi theme configuration
- Set up Tailwind CSS integration in Storybook
- Configure dark/light mode switching with next-themes

## Phase 2: Design System Foundation

### Update Tailwind Configuration

- Extend `tailwind.config.ts` with complete Japandi color palette
- Define color tokens for primary, secondary, app/UI, and marketing categories
- Add custom typography scale and spacing for Japandi aesthetic
- Configure CSS variables for theme switching

### Update Global Styles

- Replace `globals.css` with Japandi color CSS variables
- Define light and dark mode color mappings
- Add base layer styles for typography and spacing
- Include shadcn/ui base styles

### Create shadcn/ui Configuration

- Generate `components.json` with custom Japandi theme
- Configure component paths and import aliases
- Set up CSS variables approach for theming

## Phase 3: Brand Documentation

### Create Design System Documentation

Create `docs/design-system.md` with:

- Complete color palette with hex codes and usage guidelines
- Primary colors (Creamy White, Soft Stone, Warm Taupe)
- Secondary colors (Earthy Brown, Blush Sand, Muted Sage Green)
- App/UI colors (Golden Straw, Meadow Morn, Deep Charcoal)
- Marketing colors (Terracotta, Rich Brown, Charcoal Black)
- Typography guidelines and font pairings
- Spacing and layout principles
- Component usage patterns

### Create Brand Voice Documentation

Create `docs/brand-voice.md` with:

- Brand personality and tone guidelines
- Voice characteristics (calm, natural, minimal, intentional)
- Writing style for UI copy
- Content guidelines for different contexts
- Example copy for common UI patterns

## Phase 4: Core shadcn/ui Primitives

### Install and Style Core Components

Install via shadcn CLI and customize with Japandi theme:

- Button (with variants: default, secondary, outline, ghost)
- Input (with focus states using Muted Sage Green)
- Card (with Soft Stone borders and Creamy White backgrounds)
- Dialog/Modal (with overlay using Deep Charcoal opacity)
- Select (with Meadow Morn highlights)
- Checkbox (with Earthy Brown checked state)
- Switch (replace existing dark-mode-toggle approach)
- Tabs (with Golden Straw active indicators)

### Create Storybook Stories for Core Components

For each component create `.stories.tsx` files with:

- Default state
- All variants and sizes
- Interactive controls
- Accessibility documentation
- Light/dark mode examples

## Phase 5: Extended Component Set

### Install and Style Extended Components

- Dropdown Menu (with Blush Sand hover states)
- Popover (with Warm Taupe borders)
- Toast/Sonner (with color-coded variants)
- Sheet (side drawer with smooth animations)
- Command Palette (with keyboard navigation)
- Calendar (with Muted Sage Green selections)

### Create Storybook Stories for Extended Components

- Document all props and variants
- Show composition examples
- Include accessibility notes
- Demonstrate responsive behavior

## Phase 6: Component Replacement & Integration

### Replace Existing Components

- Replace `dark-mode-toggle.tsx` with shadcn Switch component
- Update theme toggle to use new Japandi-styled switch
- Ensure next-themes integration works seamlessly

### Update Component Imports

- Update all imports across the app to use new shadcn components
- Test existing panels (Calendar, Email, Home, Tasks) with new styles
- Verify GoogleCalendarAuth component styling

### Create Composite Components

- Build higher-level components using primitives
- Document composition patterns in Storybook
- Show real-world usage examples from the app

## Phase 7: Documentation & Polish

### Storybook Documentation Pages

- Create welcome page explaining the Japandi design philosophy
- Add color palette showcase page
- Include typography specimens
- Document spacing and layout system

### Accessibility Audit

- Run a11y addon on all components
- Fix any contrast issues (while maintaining Japandi aesthetic)
- Ensure keyboard navigation works properly
- Add ARIA labels where needed

### Package Scripts

Add to `package.json`:

- `storybook`: Run Storybook dev server
- `build-storybook`: Build static Storybook
- `storybook:test`: Run interaction tests

## Deliverables

1. Fully configured Storybook with Japandi theme
2. Extended set of shadcn/ui components (Button, Input, Card, Dialog, Select, Checkbox, Switch, Tabs, Dropdown Menu, Popover, Toast, Sheet, Command, Calendar)
3. Comprehensive Storybook stories for all components
4. `docs/design-system.md` - Complete design system documentation
5. `docs/brand-voice.md` - Brand voice and tone guidelines
6. Updated `tailwind.config.ts` with Japandi color system
7. Replaced existing UI components with shadcn equivalents
8. Working dark/light mode with Japandi color palette

### To-dos

- [ ] Install Storybook, shadcn/ui CLI, and all required dependencies
- [ ] Set up Storybook configuration files with Next.js and theme support
- [ ] Extend Tailwind config with complete Japandi color palette and design tokens
- [ ] Replace globals.css with Japandi CSS variables and shadcn base styles
- [ ] Generate and configure components.json for shadcn/ui
- [ ] Create docs/design-system.md with color palette and design guidelines
- [ ] Create docs/brand-voice.md with brand voice and tone guidelines
- [ ] Install and customize core shadcn components (Button, Input, Card, Dialog, Select, Checkbox, Switch, Tabs)
- [ ] Create Storybook stories for all core components
- [ ] Install and customize extended shadcn components (Dropdown Menu, Popover, Toast, Sheet, Command, Calendar)
- [ ] Create Storybook stories for all extended components
- [ ] Replace dark-mode-toggle and update component imports across the app
- [ ] Create Storybook documentation pages (welcome, colors, typography)
- [ ] Run accessibility audit and fix any issues
- [ ] Add Storybook scripts to package.json