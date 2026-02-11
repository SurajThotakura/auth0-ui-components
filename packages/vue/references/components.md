# Vue Components

> UI primitives, feature components, and blocks anatomy for shadcn-vue pattern.

---

## Component Types

| Type                  | Purpose                              | Example                       |
| --------------------- | ------------------------------------ | ----------------------------- |
| **UI Primitive**      | Reusable atoms (button, input, card) | `Button.vue`, `TextField.vue` |
| **Feature Component** | Domain-specific UI (forms, sections) | `OrganizationDetails.vue`     |
| **Block**             | Page-level entry points, scope-gated | `OrganizationDetailsEdit.vue` |

---

## Pattern 1: Primitive Component (Polymorphic with CVA)

```vue
<!-- src/components/ui/Button.vue -->
<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { Primitive } from 'reka-ui';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:bg-primary/90 shadow-button-resting hover:shadow-button-hover border border-primary theme-default:before:from-primary-foreground/0 theme-default:before:to-primary-foreground/15 theme-default:before:absolute theme-default:before:inset-0 theme-default:before:bg-gradient-to-t theme-default:active:scale-[0.99]',
        outline:
          'border border-input bg-background hover:bg-muted text-primary shadow-button-outlined-resting hover:shadow-button-outlined-hover',
        ghost: 'hover:bg-muted text-primary bg-transparent',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-button-destructive-resting',
        link: 'text-foreground underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 rounded-2xl px-4 py-2.5',
        xs: 'h-7 rounded-md px-2 py-1.5 text-xs',
        sm: 'h-8 gap-1.5 rounded-xl px-3 py-2 text-xs',
        lg: 'h-12 rounded-3xl px-6 py-3 text-base',
        icon: 'size-7 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

type ButtonVariants = VariantProps<typeof buttonVariants>;

interface Props extends PrimitiveProps {
  variant?: ButtonVariants['variant'];
  size?: ButtonVariants['size'];
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
});
</script>

<template>
  <Primitive
    data-slot="button"
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
```

**Key points:**

- Use `Primitive` from `reka-ui` for `as`/`as-child` polymorphism
- `data-slot="button"` is required on root element
- CVA strings must match React exactly (including `theme-default:` prefixes)
- Props interface extends `PrimitiveProps` for polymorphism support

---

## Pattern 2: Plain HTML Wrapper

```vue
<!-- src/components/ui/Card.vue -->
<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-slot="card"
    :class="cn('rounded-xl border bg-card text-card-foreground shadow-sm', props.class)"
  >
    <slot />
  </div>
</template>
```

```vue
<!-- src/components/ui/CardHeader.vue -->
<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div data-slot="card-header" :class="cn('flex flex-col space-y-1.5 p-6', props.class)">
    <slot />
  </div>
</template>
```

---

## Pattern 3: Reka-UI Primitive Wrapper (useForwardProps)

```vue
<!-- src/components/ui/dialog/DialogContent.vue -->
<script setup lang="ts">
import type { DialogContentProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { XIcon } from 'lucide-vue-next';
import { DialogContent, DialogPortal, DialogOverlay, DialogClose, useForwardProps } from 'reka-ui';
import { cn } from '@/lib/utils';

const props = defineProps<
  DialogContentProps & {
    class?: HTMLAttributes['class'];
  }
>();

const delegatedProps = reactiveOmit(props, 'class');
const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <DialogPortal>
    <DialogOverlay data-slot="dialog-overlay" class="fixed inset-0 z-50 bg-black/50" />
    <DialogContent
      data-slot="dialog-content"
      v-bind="forwardedProps"
      :class="
        cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
          'rounded-lg border bg-background p-6 shadow-lg',
          props.class,
        )
      "
    >
      <slot />
      <DialogClose class="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
        <XIcon class="size-4" />
        <span class="sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
```

---

## Pattern 4: Forwarding Props AND Emits

```vue
<!-- src/components/ui/dialog/Dialog.vue -->
<script setup lang="ts">
import type { DialogRootEmits, DialogRootProps } from 'reka-ui';
import { DialogRoot, useForwardPropsEmits } from 'reka-ui';

const props = defineProps<DialogRootProps>();
const emits = defineEmits<DialogRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <DialogRoot v-bind="forwarded">
    <slot />
  </DialogRoot>
</template>
```

---

## Pattern 5: TextField with Adornments

```vue
<!-- src/components/ui/TextField.vue -->
<script setup lang="ts">
import type { HTMLAttributes, InputHTMLAttributes } from 'vue';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textFieldVariants = cva(
  'flex w-full items-center rounded-xl border transition-colors focus-within:ring-2 focus-within:ring-ring',
  {
    variants: {
      variant: {
        default: 'border-input bg-background hover:border-muted-foreground/30',
        destructive: 'border-destructive bg-destructive/5',
      },
      size: {
        default: 'h-10 text-sm',
        sm: 'h-8 text-xs',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

type TextFieldVariants = VariantProps<typeof textFieldVariants>;

interface Props extends /* @vue-ignore */ InputHTMLAttributes {
  label?: string;
  helperText?: string;
  errorText?: string;
  variant?: TextFieldVariants['variant'];
  size?: TextFieldVariants['size'];
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const model = defineModel<string>();
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-sm font-medium text-foreground">
      {{ label }}
    </label>
    <div data-slot="text-field" :class="cn(textFieldVariants({ variant, size }), props.class)">
      <slot name="startAdornment" />
      <input
        v-model="model"
        :class="
          cn(
            'flex-1 bg-transparent px-3 py-2 outline-none placeholder:text-muted-foreground',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )
        "
        v-bind="$attrs"
      />
      <slot name="endAdornment" />
    </div>
    <p v-if="helperText && !errorText" class="text-xs text-muted-foreground">
      {{ helperText }}
    </p>
    <p v-if="errorText" class="text-xs text-destructive">
      {{ errorText }}
    </p>
  </div>
</template>
```

---

## Barrel Export Pattern

```typescript
// src/components/ui/index.ts — Single file for ALL UI exports
export { default as Button } from './Button.vue';
export { default as Spinner } from './Spinner.vue';
export { default as Card } from './Card.vue';
export { default as CardHeader } from './CardHeader.vue';
export { default as CardContent } from './CardContent.vue';
export { default as CardFooter } from './CardFooter.vue';
export { default as TextField } from './TextField.vue';
export { default as Separator } from './Separator.vue';
export { default as Section } from './Section.vue';
export { default as Header } from './Header.vue';
export { default as FormActions } from './FormActions.vue';

// Multi-part components
export * from './dialog';
```

---

## data-slot Convention

Every UI component must set `data-slot` on its root element. Values match React exactly:

| Component      | data-slot value  |
| -------------- | ---------------- |
| Button         | `button`         |
| Card           | `card`           |
| CardHeader     | `card-header`    |
| CardContent    | `card-content`   |
| CardFooter     | `card-footer`    |
| TextField      | `text-field`     |
| Dialog content | `dialog-content` |
| Dialog overlay | `dialog-overlay` |
| Switch         | `switch`         |
| Switch thumb   | `switch-thumb`   |

---

## cn() Utility

```typescript
// src/lib/utils.ts — identical to React
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## File Structure Rule

**FLAT structure for UI components:**

```
✅ Correct:
components/ui/
├── Button.vue
├── Card.vue
├── CardHeader.vue
├── TextField.vue
└── index.ts

❌ Wrong (over-engineered):
components/ui/
├── button/
│   ├── Button.vue
│   ├── button-variants.ts
│   └── index.ts
├── card/
│   ├── Card.vue
│   └── index.ts
```

**Only multi-part components** (Dialog, Select, Combobox with 4+ files) get subdirectories.
