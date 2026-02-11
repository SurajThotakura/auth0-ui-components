# Vue Anti-Patterns

> Common pitfalls when converting from React and their fixes.

---

## Provider-Related (Most Critical)

| Mistake                                        | Symptom                                              | Fix                             |
| ---------------------------------------------- | ---------------------------------------------------- | ------------------------------- |
| Creating composables before providers          | `inject()` returns `undefined`, no error             | Create providers FIRST          |
| Creating components before providers           | Runtime error: "Cannot read property X of undefined" | Create providers FIRST          |
| Forgetting a `provide()` call                  | One composable works, another returns `undefined`    | Check all 4 keys are provided   |
| Importing `@auth0/auth0-vue` in proxy provider | Bundle size bloat, breaks tree-shaking               | Use separate entry points       |
| Not exporting provider from entry point        | Consumer can't access provider                       | Check `index.ts` and `proxy.ts` |

**Remember:** Vue's `inject()` returns `undefined` silently when provider is missing. There is NO error message.

---

## React → Vue Conversion Errors

### State Management

```typescript
// ❌ WRONG: Using React patterns
const [count, setCount] = useState(0); // React syntax in Vue

// ✅ CORRECT: Vue reactive state
const count = ref(0);
// Update: count.value = newValue
```

### Derived State

```typescript
// ❌ WRONG: Manual dependency tracking
const doubled = useMemo(() => count * 2, [count]);

// ✅ CORRECT: Vue auto-tracks dependencies
const doubled = computed(() => count.value * 2);
```

### Side Effects

```typescript
// ❌ WRONG: useEffect with empty deps for mount
useEffect(() => {
  fetchData();
}, []);

// ✅ CORRECT: Vue lifecycle hook
onMounted(() => {
  fetchData();
});
```

### Context

```typescript
// ❌ WRONG: React Context pattern
const CoreClientContext = createContext(null);
<CoreClientContext.Provider value={client}>{children}</CoreClientContext.Provider>
const client = useContext(CoreClientContext);

// ✅ CORRECT: Vue provide/inject
const CORE_CLIENT_KEY: InjectionKey<CoreClientInterface> = Symbol('CoreClient');
provide(CORE_CLIENT_KEY, client);
const client = inject(CORE_CLIENT_KEY);
```

---

## Template Errors

### Conditionals

```vue
<!-- ❌ WRONG: JSX conditional -->
{condition &&
<Component />
}

<!-- ✅ CORRECT: Vue v-if -->
<Component v-if="condition" />
```

### Lists

```vue
<!-- ❌ WRONG: JSX map -->
{items.map(item =>
<Item key="{item.id}" {...item} />
)}

<!-- ✅ CORRECT: Vue v-for -->
<Item v-for="item in items" :key="item.id" v-bind="item" />
```

### Events

```vue
<!-- ❌ WRONG: React onClick -->
<button onClick={handleClick}>

<!-- ✅ CORRECT: Vue @click -->
<button @click="handleClick">
```

### Class Names

```vue
<!-- ❌ WRONG: React className -->
<div className="container">

<!-- ✅ CORRECT: Vue class -->
<div class="container">
```

### Input Events

```vue
<!-- ❌ WRONG: React onChange for text inputs -->
<input onChange="{handleChange}" />

<!-- ✅ CORRECT: Vue @input for text inputs -->
<input @input="handleInput" />
<!-- Or use v-model -->
<input v-model="value" />
```

---

## Component Structure Errors

### Script Setup

```vue
<!-- ❌ WRONG: Options API -->
<script>
export default {
  data() {
    return { count: 0 };
  },
  methods: {
    increment() {
      this.count++;
    },
  },
};
</script>

<!-- ✅ CORRECT: Composition API with script setup -->
<script setup lang="ts">
const count = ref(0);
const increment = () => count.value++;
</script>
```

### Mixins

```vue
<!-- ❌ WRONG: Mixins -->
<script>
import { dataMixin } from './mixins';
export default {
  mixins: [dataMixin],
};
</script>

<!-- ✅ CORRECT: Composables -->
<script setup lang="ts">
import { useData } from './composables/use-data';
const { data, isLoading } = useData();
</script>
```

### this Keyword

```vue
<!-- ❌ WRONG: Using this in script setup -->
<script setup>
this.count++; // 'this' is undefined in script setup
</script>

<!-- ✅ CORRECT: Direct access -->
<script setup>
count.value++;
</script>
```

---

## Reactivity Errors

### Destructuring Props

```vue
<!-- ❌ WRONG: Destructuring loses reactivity -->
<script setup>
const { count } = defineProps<{ count: number }>();
watch(count, ...);  // Won't work - count is not reactive
</script>

<!-- ✅ CORRECT: Use props directly or toRef -->
<script setup>
const props = defineProps<{ count: number }>();
watch(() => props.count, ...);  // Works
// OR
const count = toRef(props, 'count');
watch(count, ...);  // Also works
</script>
```

### Mutating Props

```vue
<!-- ❌ WRONG: Mutating props directly -->
<script setup>
const props = defineProps<{ value: string }>();
props.value = 'new';  // Error: props are readonly
</script>

<!-- ✅ CORRECT: Emit or use v-model -->
<script setup>
const emit = defineEmits<{ 'update:value': [val: string] }>();
emit('update:value', 'new');
// OR
const model = defineModel<string>();
model.value = 'new';
</script>
```

### Reactive Return Values

```typescript
// ❌ WRONG: Returning reactive() from composable
function useData() {
  const state = reactive({ count: 0 });
  return state; // Loses reactivity on destructure
}
const { count } = useData(); // count is not reactive!

// ✅ CORRECT: Return refs
function useData() {
  const count = ref(0);
  return { count }; // Works with destructuring
}
const { count } = useData(); // count is reactive ✓
```

---

## UI Component Errors

### Missing data-slot

```vue
<!-- ❌ WRONG: No data-slot attribute -->
<template>
  <div class="card">
    <slot />
  </div>
</template>

<!-- ✅ CORRECT: Add data-slot for styling hooks -->
<template>
  <div data-slot="card" class="card">
    <slot />
  </div>
</template>
```

### Wrong Primitive Library

```vue
<!-- ❌ WRONG: Using radix-vue or raw radix -->
import { Slot } from '@radix-ui/react-slot'; import { Button } from 'radix-vue';

<!-- ✅ CORRECT: Use reka-ui -->
import { Primitive } from 'reka-ui';
```

### Nested Directory Structure

```
❌ WRONG:
components/ui/
├── button/
│   ├── Button.vue
│   └── index.ts

✅ CORRECT:
components/ui/
├── Button.vue
└── index.ts
```

---

## Form Errors

### Wrong Form Library

```typescript
// ❌ WRONG: Using react-hook-form
import { useForm } from 'react-hook-form';

// ✅ CORRECT: Use vee-validate
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
```

### Wrong Zod Integration

```typescript
// ❌ WRONG: React resolver
import { zodResolver } from '@hookform/resolvers/zod';

// ✅ CORRECT: vee-validate adapter
import { toTypedSchema } from '@vee-validate/zod';
```

---

## TypeScript Errors

### Type vs Value Imports

```typescript
// ❌ WRONG: Importing value when type is needed
import { CoreClientInterface } from '@auth0/universal-components-core';
const key: CoreClientInterface = ...;  // Error if it's a type

// ✅ CORRECT: Use import type
import type { CoreClientInterface } from '@auth0/universal-components-core';
```

### Missing Script Lang

```vue
<!-- ❌ WRONG: No lang="ts" -->
<script setup>
const count = ref(0); // No type inference
</script>

<!-- ✅ CORRECT: Add lang="ts" -->
<script setup lang="ts">
const count = ref(0); // Full TypeScript support
</script>
```

---

## Build Errors Quick Reference

| Error                                                | Cause                        | Fix                            |
| ---------------------------------------------------- | ---------------------------- | ------------------------------ |
| `Cannot find module 'X'`                             | Missing import or wrong path | Check import paths             |
| `Property 'X' does not exist on type 'Y'`            | Wrong type                   | Check type definition          |
| `Type 'X' is not assignable to type 'Y'`             | Type mismatch                | Use correct type               |
| `'X' refers to a value, but is being used as a type` | Import value vs type         | Use `import type { X }`        |
| `Cannot find name 'defineProps'`                     | Missing `lang="ts"`          | Add `<script setup lang="ts">` |
