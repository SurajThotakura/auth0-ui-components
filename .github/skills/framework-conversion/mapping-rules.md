# Framework Conversion Mapping Rules

Quick reference for converting React patterns to Vue 3, Angular 17+, and Svelte 5.

## State Management

| React                     | Vue 3               | Angular 17+                | Svelte 5                 |
| ------------------------- | ------------------- | -------------------------- | ------------------------ |
| `useState(value)`         | `ref(value)`        | `signal(value)`            | `let x = $state(value)`  |
| `useState({...})`         | `reactive({...})`   | `signal({...})`            | `let x = $state({...})`  |
| `setCount(c => c + 1)`    | `count.value++`     | `count.update(c => c + 1)` | `count++`                |
| `useMemo(() => x, [dep])` | `computed(() => x)` | `computed(() => x)`        | `let x = $derived(expr)` |
| `useCallback(fn, [deps])` | Plain function      | Plain method               | Plain function           |
| `useRef(value)`           | `ref(value)`        | `signal(value)`            | `let x = $state(value)`  |

## Side Effects

| React                      | Vue 3                   | Angular 17+             | Svelte 5               |
| -------------------------- | ----------------------- | ----------------------- | ---------------------- |
| `useEffect(() => {}, [])`  | `onMounted(() => {})`   | `ngOnInit()`            | `onMount(() => {})`    |
| `useEffect(() => {}, [x])` | `watch(x, () => {})`    | `effect(() => { x() })` | `$effect(() => { x })` |
| `useEffect(() => {})`      | `watchEffect(() => {})` | `effect(() => {})`      | `$effect(() => {})`    |
| `useLayoutEffect()`        | `onMounted()`           | `ngAfterViewInit()`     | `onMount()`            |
| Return cleanup             | `onUnmounted()`         | `ngOnDestroy()`         | `onDestroy()`          |

## Context / Dependency Injection

| React             | Vue 3                        | Angular 17+           | Svelte 5               |
| ----------------- | ---------------------------- | --------------------- | ---------------------- |
| `createContext()` | `Symbol()` as `InjectionKey` | `InjectionToken`      | Context key            |
| `useContext(Ctx)` | `inject(Key)`                | Constructor injection | `getContext(key)`      |
| `<Ctx.Provider>`  | `provide(Key, val)`          | `providers: []`       | `setContext(key, val)` |

## Props & Events

| React                  | Vue 3                       | Angular 17+          | Svelte 5                 |
| ---------------------- | --------------------------- | -------------------- | ------------------------ |
| `interface Props {}`   | `defineProps<Props>()`      | `@Input()` decorator | `let {...} = $props()`   |
| Default props          | `withDefaults(...)`         | Property initializer | Default in destructuring |
| `onClick?: () => void` | `defineEmits<{click:[]}>()` | `@Output() click`    | `onclick?: () => void`   |
| `props.children`       | `<slot />`                  | `<ng-content />`     | `<slot />`               |
| `{...props}`           | `v-bind="$attrs"`           | Host binding         | `{...$$restProps}`       |

## Template Syntax

### Conditional Rendering

| React               | Vue 3                      | Angular 17+                   | Svelte 5                      |
| ------------------- | -------------------------- | ----------------------------- | ----------------------------- |
| `{x && <A/>}`       | `<A v-if="x"/>`            | `@if (x) { <A/> }`            | `{#if x}<A/>{/if}`            |
| `{x ? <A/> : <B/>}` | `<A v-if="x"/><B v-else/>` | `@if (x) {<A/>} @else {<B/>}` | `{#if x}<A/>{:else}<B/>{/if}` |
| `{x && y && <A/>}`  | `<A v-if="x && y"/>`       | `@if (x && y) {<A/>}`         | `{#if x && y}<A/>{/if}`       |

### List Rendering

| React                               | Vue 3                                 | Angular 17+                            | Svelte 5                               |
| ----------------------------------- | ------------------------------------- | -------------------------------------- | -------------------------------------- |
| `{items.map(i => <X key={i.id}/>)}` | `<X v-for="i in items" :key="i.id"/>` | `@for (i of items; track i.id) {<X/>}` | `{#each items as i (i.id)}<X/>{/each}` |
| With index                          | `v-for="(i, idx) in items"`           | `track $index`                         | `{#each items as i, idx}`              |

### Event Handling

| React                    | Vue 3                  | Angular 17+              | Svelte 5                 |
| ------------------------ | ---------------------- | ------------------------ | ------------------------ | -------------------- |
| `onClick={fn}`           | `@click="fn"`          | `(click)="fn()"`         | `onclick={fn}`           |
| `onClick={(e) => fn(e)}` | `@click="fn($event)"`  | `(click)="fn($event)"`   | `onclick={(e) => fn(e)}` |
| `onChange={fn}`          | `@input="fn"`          | `(input)="fn($event)"`   | `oninput={fn}`           |
| `onSubmit={fn}`          | `@submit.prevent="fn"` | `(ngSubmit)="fn()"`      | `onsubmit                | preventDefault={fn}` |
| `onKeyDown={fn}`         | `@keydown="fn"`        | `(keydown)="fn($event)"` | `onkeydown={fn}`         |

### Attribute Binding

| React            | Vue 3             | Angular 17+             | Svelte 5         |
| ---------------- | ----------------- | ----------------------- | ---------------- |
| `className={x}`  | `:class="x"`      | `[class]="x"`           | `class={x}`      |
| `style={{...}}`  | `:style="{...}"`  | `[style]="..."`         | `style="..."`    |
| `disabled={x}`   | `:disabled="x"`   | `[disabled]="x"`        | `disabled={x}`   |
| `id={x}`         | `:id="x"`         | `[id]="x"`              | `id={x}`         |
| `aria-label={x}` | `:aria-label="x"` | `[attr.aria-label]="x"` | `aria-label={x}` |

### Refs (DOM Access)

| React             | Vue 3                  | Angular 17+           | Svelte 5               |
| ----------------- | ---------------------- | --------------------- | ---------------------- |
| `useRef<T>(null)` | `ref<T \| null>(null)` | `viewChild<T>('ref')` | `let el: T`            |
| `<div ref={ref}>` | `<div ref="ref">`      | `<div #ref>`          | `<div bind:this={el}>` |
| `ref.current`     | `ref.value`            | `this.ref()`          | `el`                   |

## Component Definition

### React

```tsx
interface Props {
  title: string;
  onClick?: () => void;
}

export function MyComponent({ title, onClick }: Props) {
  return <div onClick={onClick}>{title}</div>;
}
```

### Vue 3

```vue
<script setup lang="ts">
defineProps<{ title: string }>();
const emit = defineEmits<{ click: [] }>();
</script>
<template>
  <div @click="emit('click')">{{ title }}</div>
</template>
```

### Angular 17+

```typescript
@Component({
  selector: 'app-my',
  standalone: true,
  template: `<div (click)="click.emit()">{{ title() }}</div>`,
})
export class MyComponent {
  title = input.required<string>();
  click = output();
}
```

### Svelte 5

```svelte
<script lang="ts">
  let { title, onclick }: { title: string; onclick?: () => void } = $props();
</script>
<div onclick={onclick}>{title}</div>
```

## Auth0 Components Integration

### useCoreClient

| Framework | Implementation                                                            |
| --------- | ------------------------------------------------------------------------- |
| React     | `const { coreClient } = useCoreClient()`                                  |
| Vue 3     | `const coreClient = useCoreClient()` (returns `Ref<CoreClientInterface>`) |
| Angular   | `constructor(private coreClient: CoreClientService)`                      |
| Svelte    | `const coreClient = getContext<CoreClientInterface>('coreClient')`        |

### useTranslator

| Framework | Implementation                                           |
| --------- | -------------------------------------------------------- |
| React     | `const { t } = useTranslator('ns')`                      |
| Vue 3     | `const { t } = useTranslator('ns')` (t is `ComputedRef`) |
| Angular   | `readonly t = this.translator.get('ns')`                 |
| Svelte    | `const { t } = useTranslator('ns')`                      |

### useTheme

| Framework | Implementation                                                     |
| --------- | ------------------------------------------------------------------ |
| React     | `const { isDarkMode } = useTheme()`                                |
| Vue 3     | `const { isDarkMode } = useTheme()` (isDarkMode is `Ref<boolean>`) |
| Angular   | `readonly isDarkMode = this.themeService.isDarkMode`               |
| Svelte    | `const { isDarkMode } = getContext('theme')`                       |

## File Structure Mapping

```
React                              Vue 3
─────                              ─────
src/hooks/use-*.ts            →   src/composables/use-*.ts
src/providers/*.tsx           →   src/plugins/*.ts
src/components/**/*.tsx       →   src/components/**/*.vue or *.ts
src/blocks/**/*.tsx           →   src/blocks/**/*.vue
src/hoc/with-*.tsx            →   (use composables instead)
src/types/*.ts                →   src/types/*.ts (mostly reusable)

React                              Angular 17+
─────                              ───────────
src/hooks/use-*.ts            →   src/services/*.service.ts
src/providers/*.tsx           →   src/services/*.service.ts + providers
src/components/**/*.tsx       →   src/components/**/*.component.ts
src/blocks/**/*.tsx           →   src/blocks/**/*.component.ts
src/hoc/with-*.tsx            →   (use services/directives instead)
src/types/*.ts                →   src/types/*.ts (mostly reusable)

React                              Svelte 5
─────                              ────────
src/hooks/use-*.ts            →   src/lib/use-*.ts or stores
src/providers/*.tsx           →   src/lib/context/*.ts
src/components/**/*.tsx       →   src/lib/components/**/*.svelte
src/blocks/**/*.tsx           →   src/lib/blocks/**/*.svelte
src/hoc/with-*.tsx            →   (use context/stores instead)
src/types/*.ts                →   src/lib/types/*.ts (mostly reusable)
```

## Import Mappings

### React

```tsx
import { useState, useEffect, useMemo, useCallback, useContext, useRef } from 'react';
```

### Vue 3

```ts
import {
  ref,
  reactive,
  computed,
  watch,
  watchEffect,
  onMounted,
  onUnmounted,
  inject,
  provide,
} from 'vue';
```

### Angular 17+

```ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  effect,
  inject,
} from '@angular/core';
```

### Svelte 5

```ts
// Runes are compiler-provided: $state, $derived, $effect, $props
import { onMount, onDestroy, getContext, setContext } from 'svelte';
```

## Package Dependencies

### Vue 3 Package

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "@vueuse/core": "^10.9.0",
    "@tanstack/vue-query": "^5.56.2",
    "radix-vue": "^1.9.0"
  }
}
```

### Angular Package

```json
{
  "dependencies": {
    "@angular/core": "^17.0.0",
    "@angular/common": "^17.0.0",
    "@tanstack/angular-query": "^5.56.2",
    "@ng-icons/core": "^25.0.0"
  }
}
```

### Svelte 5 Package

```json
{
  "dependencies": {
    "svelte": "^5.0.0",
    "@tanstack/svelte-query": "^5.56.2",
    "bits-ui": "^0.21.0"
  }
}
```
