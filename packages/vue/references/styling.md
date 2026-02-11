# Vue Styling

> Tailwind v4, CVA, dark mode, and theming patterns.

---

## CSS Architecture

```
styles/
├── globals.css           # Main entry point
├── font-sizes.css        # Semantic font size tokens
├── light-palette.css     # OKLCH color scales (:root)
├── dark-palette.css      # Inverted OKLCH scales (.dark)
└── themes/
    ├── default.css       # Rich shadows, standard radii
    ├── minimal.css       # Flat design, no shadows
    └── rounded.css       # Pill-shaped elements
```

### globals.css Structure

```css
/* Import Tailwind v4 (config-free) */
@import 'tailwindcss';

/* Design tokens */
@import './font-sizes.css';

/* Themes (include light/dark palettes) */
@import './themes/default.css';
@import './themes/minimal.css';
@import './themes/rounded.css';

/* Base layer resets */
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Register CSS vars as Tailwind tokens */
@theme inline {
  --color-background: var(--background, var(--color-neutral-min));
  --color-foreground: var(--foreground, var(--color-neutral-max));
  --color-primary: var(--primary, var(--color-carbon-9));
  /* ... more tokens */
}
```

---

## Theme Activation

Themes are controlled via HTML attributes:

```html
<!-- Theme variant via data-theme -->
<html data-theme="default">
  <!-- default | minimal | rounded -->

  <!-- Dark mode via .dark class -->
  <html data-theme="default" class="dark"></html>
</html>
```

### Apply Theme in Provider

```typescript
import { applyStyleOverrides } from '@auth0/universal-components-core';

onMounted(() => {
  applyStyleOverrides(
    props.themeSettings.variables ?? { common: {}, light: {}, dark: {} },
    props.themeSettings.mode ?? 'light', // 'light' | 'dark'
    props.themeSettings.theme ?? 'default', // 'default' | 'minimal' | 'rounded'
  );
});
```

---

## Custom Variants (Theme-Specific Classes)

Each theme registers a Tailwind v4 custom variant:

```css
/* themes/default.css */
@custom-variant theme-default {
  &:where([data-theme='default'] *) {
    @slot;
  }
}

/* themes/minimal.css */
@custom-variant theme-minimal {
  &:where([data-theme='minimal'] *) {
    @slot;
  }
}

/* themes/rounded.css */
@custom-variant theme-rounded {
  &:where([data-theme='rounded'] *) {
    @slot;
  }
}
```

### Using Theme Variants

```vue
<template>
  <Primitive
    :class="
      cn(
        buttonVariants({ variant, size }),
        'theme-default:before:bg-gradient-to-t',
        'theme-default:active:scale-[0.99]',
        'theme-minimal:shadow-none',
        'theme-rounded:rounded-full',
        props.class,
      )
    "
  >
    <slot />
  </Primitive>
</template>
```

---

## CVA (Class Variance Authority)

### Basic Pattern

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  // Base classes (always applied)
  'inline-flex items-center justify-center gap-2 text-sm font-medium transition-all',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input bg-background hover:bg-muted',
        ghost: 'hover:bg-muted text-primary bg-transparent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

type ButtonVariants = VariantProps<typeof buttonVariants>;
```

### Using CVA in Components

```vue
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: ButtonVariants['variant'];
    size?: ButtonVariants['size'];
    class?: string;
  }>(),
  {
    variant: 'primary',
    size: 'default',
  },
);
</script>

<template>
  <button :class="cn(buttonVariants({ variant, size }), props.class)">
    <slot />
  </button>
</template>
```

---

## cn() Utility

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Usage:**

```vue
<div :class="cn(
  'base-class',
  isActive && 'active-class',
  isDisabled ? 'disabled-class' : 'enabled-class',
  props.class
)">
```

---

## Color System (OKLCH Palettes)

Colors use OKLCH (perceptually uniform) with 12-step scales:

### Light Mode (`:root`)

```css
:root {
  --color-neutral-min: oklch(100% 0 0); /* White */
  --color-neutral-1: oklch(98% 0.005 240);
  --color-neutral-2: oklch(96% 0.007 240);
  /* ... steps 3-11 */
  --color-neutral-max: oklch(10% 0.01 240); /* Near black */

  --color-carbon-1: oklch(98% 0.008 84);
  /* ... */
  --color-carbon-9: oklch(45% 0.09 84); /* Brand base */
  /* ... */
}
```

### Dark Mode (`.dark`)

```css
.dark {
  --color-neutral-min: oklch(10% 0.01 240); /* Near black */
  --color-neutral-max: oklch(100% 0 0); /* White */
  /* Inverted lightness values */
}
```

---

## Theme Differences

| Token    | Default                      | Minimal              | Rounded            |
| -------- | ---------------------------- | -------------------- | ------------------ |
| Shadows  | Rich multi-layer bevel       | `none` (flat)        | `none`             |
| Radii    | 2px → 56px                   | Slightly larger      | Much larger (pill) |
| Primary  | `carbon-12` (darker)         | `carbon-9` (lighter) | `carbon-12`        |
| Input bg | `neutral-min` (white)        | `neutral-3` (grey)   | `neutral-min`      |
| Buttons  | Gradient `::before`, borders | Flat, no effects     | Flat, no effects   |

---

## Dark Mode Toggle

```vue
<script setup lang="ts">
import { useTheme } from '@/composables/use-theme';

const { isDarkMode } = useTheme();

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  document.documentElement.classList.toggle('dark', isDarkMode.value);
};
</script>

<template>
  <button @click="toggleDarkMode">
    {{ isDarkMode ? '🌙' : '☀️' }}
  </button>
</template>
```

---

## Component Styling Overrides

Components accept styling props for CSS variable overrides:

```vue
<script setup lang="ts">
import { getComponentStyles } from '@auth0/universal-components-core';
import { computed } from 'vue';

const props = defineProps<{
  styling?: {
    variables?: {
      common?: Record<string, string>;
      light?: Record<string, string>;
      dark?: Record<string, string>;
    };
    classes?: Record<string, string>;
  };
}>();

const { isDarkMode } = useTheme();

const currentStyles = computed(() => getComponentStyles(props.styling, isDarkMode.value));
</script>

<template>
  <div :style="currentStyles.variables" :class="currentStyles.classes?.container">
    <slot />
  </div>
</template>
```

---

## Visual Consistency Rules

1. **Copy exact Tailwind class strings** from React (including all `theme-*:` variants)
2. **Same CVA variant definitions** — `buttonVariants`, `textFieldVariants` must be identical
3. **Same `data-slot` attributes** — CSS selectors may target these
4. **Same `cn()` utility** — `clsx` + `tailwind-merge`
5. **Same CSS custom property references** — `var(--color-primary)`, etc.
6. **Never create Vue-specific theme overrides** — changes go in shared CSS files

---

## Tailwind v4 Notes

- **No `tailwind.config.js`** — Configuration via CSS `@theme inline {}`
- **No `content` array** — Auto-detected from project files
- **PostCSS plugin:** `@tailwindcss/postcss`

```javascript
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```
