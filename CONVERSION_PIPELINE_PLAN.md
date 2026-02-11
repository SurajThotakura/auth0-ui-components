# Automated Framework Conversion Pipeline

## Goal

Build a pipeline that converts React UI components to other frameworks using Claude Code with framework-specific SKILLS.md guidance.

**Ideal DX:** Build in React → Run CLI → PR with Vue/Angular/Svelte created

## Status: Phase 2-4 Complete ✅

### What's Been Implemented

| Item                           | Status      | Location                                               |
| ------------------------------ | ----------- | ------------------------------------------------------ |
| Vue 3 Package Structure        | ✅ Complete | `packages/vue/`                                        |
| Vue SKILLS.md                  | ✅ Complete | `packages/vue/SKILLS.md`                               |
| Core Integration Composables   | ✅ Complete | `packages/vue/src/composables/`                        |
| Auth0 Provider Plugin          | ✅ Complete | `packages/vue/src/plugins/auth0-provider.ts`           |
| Button Component (Vue)         | ✅ Complete | `packages/vue/src/components/ui/button.ts`             |
| Framework Conversion AGENTS.md | ✅ Complete | `.github/skills/framework-conversion/AGENTS.md`        |
| Mapping Rules Reference        | ✅ Complete | `.github/skills/framework-conversion/mapping-rules.md` |
| CLI Tool                       | ✅ Complete | `tools/convert/`                                       |
| GitHub Actions Workflow        | ✅ Complete | `.github/workflows/convert.yml`                        |

---

## Quick Start

### Convert a Component

```bash
# Convert a React component to Vue
pnpm convert --component components/ui/button.tsx --to vue

# Convert to multiple frameworks
pnpm convert --component components/ui/card.tsx --to vue,angular,svelte

# Convert and create PR
pnpm convert --component blocks/mfa/user-mfa.tsx --to vue --pr

# Dry run (see what would be converted)
pnpm convert --component components/ui/button.tsx --to vue --dry-run
```

### GitHub Actions

1. **Manual Dispatch**: Go to Actions → "Framework Conversion" → Run workflow
2. **PR Comment**: Comment `/convert components/ui/button.tsx to vue` on any PR

---

## Architecture

```
auth0-ui-components/
├── packages/
│   ├── core/                           # Framework-agnostic (unchanged)
│   ├── react/                          # Source of truth
│   │   ├── src/
│   │   │   ├── blocks/
│   │   │   ├── components/ui/
│   │   │   ├── hooks/
│   │   │   ├── providers/
│   │   │   └── types/
│   │   └── SKILLS.md
│   │
│   └── vue/                            # ✅ NEW - Vue 3 Composition API
│       ├── src/
│       │   ├── components/ui/          # Button converted
│       │   ├── composables/            # useCoreClient, useTranslator, etc.
│       │   ├── plugins/                # auth0-provider.ts
│       │   ├── lib/                    # theme-utils.ts
│       │   └── styles/                 # globals.css
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsup.config.ts
│       └── SKILLS.md                   # Comprehensive Vue conversion guide
│
├── .github/
│   ├── skills/
│   │   └── framework-conversion/       # ✅ NEW
│   │       ├── AGENTS.md               # Master conversion agent prompt
│   │       └── mapping-rules.md        # Quick reference mappings
│   └── workflows/
│       └── convert.yml                 # ✅ NEW - Conversion workflow
│
└── tools/
    └── convert/                        # ✅ NEW - CLI Tool
        ├── src/
        │   ├── index.ts                # Main CLI entry
        │   ├── converter.ts            # Claude Code integration
        │   ├── validator.ts            # Output validation
        │   └── git.ts                  # Branch/PR creation
        ├── package.json
        └── tsconfig.json
```

---

## Vue Package Structure

### Composables (Vue equivalents of React hooks)

| File                   | Purpose                                 |
| ---------------------- | --------------------------------------- |
| `use-core-client.ts`   | Access CoreClient instance from context |
| `use-translator.ts`    | i18n translation with namespace support |
| `use-theme.ts`         | Theme context (isDarkMode, variables)   |
| `use-error-handler.ts` | Consistent error handling               |
| `use-scope-manager.ts` | OAuth scope registration                |

### Plugin

The `Auth0ComponentsPlugin` provides global context for all composables:

```ts
import { createApp } from 'vue';
import { Auth0ComponentsPlugin } from '@auth0/universal-components-vue';

const app = createApp(App);

app.use(Auth0ComponentsPlugin, {
  domain: 'your-tenant.auth0.com',
  clientId: 'your-client-id',
  getAccessToken: async () => token,
  themeSettings: { mode: 'dark' },
});

app.mount('#app');
```

---

## Conversion Mapping Quick Reference

| React                      | Vue 3                                 |
| -------------------------- | ------------------------------------- |
| `useState(value)`          | `ref(value)`                          |
| `useEffect(() => {}, [])`  | `onMounted(() => {})`                 |
| `useEffect(() => {}, [x])` | `watch(x, () => {})`                  |
| `useMemo(() => x, [dep])`  | `computed(() => x)`                   |
| `useContext(Ctx)`          | `inject(Key)`                         |
| `{cond && <X/>}`           | `<X v-if="cond"/>`                    |
| `items.map(x => <X/>)`     | `<X v-for="x in items" :key="x.id"/>` |
| `onClick={fn}`             | `@click="fn"`                         |
| `className={cn(...)}`      | `:class="cn(...)"`                    |
| `props.children`           | `<slot/>`                             |

See `packages/vue/SKILLS.md` for comprehensive conversion patterns.

---

## CLI Tool

### Commands

```bash
# Convert a single component
pnpm convert component -c <path> -t <frameworks>

# Options:
#   -c, --component <path>    Path relative to packages/react/src
#   -t, --to <frameworks>     Target: vue, angular, svelte (comma-separated)
#   --pr                      Create pull request
#   --dry-run                 Preview without changes
#   -v, --verbose             Detailed output

# Examples:
pnpm convert component -c components/ui/button.tsx -t vue
pnpm convert component -c blocks/mfa/user-mfa.tsx -t vue,angular --pr
```

### How It Works

1. **Read** React source file
2. **Load** framework SKILLS.md and mapping-rules.md
3. **Invoke** Claude Code with conversion prompt
4. **Validate** TypeScript and lint output
5. **Write** converted file to target package
6. **Create** branch and PR (if `--pr` flag)

---

## Validation

The CLI automatically validates converted output:

1. **TypeScript**: Runs `vue-tsc --noEmit` (or framework equivalent)
2. **Linting**: Runs ESLint with framework-specific rules
3. **Framework patterns**: Checks for common anti-patterns

Validation warnings don't block conversion but are reported.

---

## Success Criteria ✅

- [x] Vue package created with proper structure
- [x] Vue package has tsup build configuration
- [x] Core integration composables (useCoreClient, useTranslator, useTheme)
- [x] Auth0 provider plugin for Vue
- [x] Button component converted as reference
- [x] Comprehensive SKILLS.md for Vue conversion
- [x] Framework conversion AGENTS.md for Claude Code
- [x] Mapping rules quick reference
- [x] CLI tool with convert command
- [x] GitHub Actions workflow for automated conversion
- [ ] Vue package builds successfully (requires npm auth setup)

---

## Next Steps

### To Complete Vue Package Setup

1. **Install dependencies** (requires npm registry auth):

   ```bash
   pnpm install
   ```

2. **Build Vue package**:

   ```bash
   cd packages/vue && pnpm build
   ```

3. **Test conversion**:
   ```bash
   pnpm convert component -c components/ui/card.tsx -t vue --dry-run
   ```

### Future Framework Support

1. **Angular 17+**: Create `packages/angular/` with standalone components
2. **Svelte 5**: Create `packages/svelte/` with runes
3. **Extend CLI**: Support `--to angular,svelte`
4. **Add SKILLS.md**: Framework-specific conversion guides

---

## Files Created

| Path                                                   | Description                 |
| ------------------------------------------------------ | --------------------------- |
| `packages/vue/package.json`                            | Vue package configuration   |
| `packages/vue/tsconfig.json`                           | TypeScript config for Vue   |
| `packages/vue/tsup.config.ts`                          | Build configuration         |
| `packages/vue/SKILLS.md`                               | Vue conversion guide (16KB) |
| `packages/vue/src/index.ts`                            | Package entry point         |
| `packages/vue/src/composables/*.ts`                    | Vue composables (5 files)   |
| `packages/vue/src/plugins/auth0-provider.ts`           | Vue plugin                  |
| `packages/vue/src/components/ui/button.ts`             | Button component            |
| `packages/vue/src/lib/theme-utils.ts`                  | Utility functions           |
| `packages/vue/src/styles/globals.css`                  | Tailwind styles             |
| `.github/skills/framework-conversion/AGENTS.md`        | Conversion agent prompt     |
| `.github/skills/framework-conversion/mapping-rules.md` | Quick reference             |
| `.github/workflows/convert.yml`                        | GitHub Actions workflow     |
| `tools/convert/package.json`                           | CLI tool configuration      |
| `tools/convert/src/*.ts`                               | CLI source files (4 files)  |
