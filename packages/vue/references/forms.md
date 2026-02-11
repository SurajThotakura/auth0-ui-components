# Vue Forms

> vee-validate + Zod patterns for form handling in Vue.

---

## Stack

| Library             | Purpose                           |
| ------------------- | --------------------------------- |
| `vee-validate`      | Form state management, validation |
| `@vee-validate/zod` | Zod schema integration            |
| `zod`               | Schema validation (from core)     |

---

## Basic Form Pattern

```vue
<script setup lang="ts">
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { TextField, Button, FormActions } from '@/components/ui';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

type FormValues = z.infer<typeof schema>;

const props = defineProps<{
  initialValues?: Partial<FormValues>;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  submit: [values: FormValues];
  cancel: [];
}>();

const { handleSubmit, resetForm, values, errors, defineField } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    name: props.initialValues?.name ?? '',
    email: props.initialValues?.email ?? '',
  },
});

// Define reactive fields
const [name, nameAttrs] = defineField('name');
const [email, emailAttrs] = defineField('email');

const onSubmit = handleSubmit((values) => {
  emit('submit', values);
});

const onCancel = () => {
  resetForm();
  emit('cancel');
};
</script>

<template>
  <form @submit.prevent="onSubmit" class="space-y-4">
    <TextField v-model="name" v-bind="nameAttrs" label="Name" :error-text="errors.name" />

    <TextField
      v-model="email"
      v-bind="emailAttrs"
      label="Email"
      type="email"
      :error-text="errors.email"
    />

    <FormActions :is-loading="isLoading" @cancel="onCancel" />
  </form>
</template>
```

---

## React → Vue Form Conversion

### Form Setup

```typescript
// ❌ React (react-hook-form)
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { name: '', email: '' },
});

// ✅ Vue (vee-validate)
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';

const { handleSubmit, resetForm, values, errors, defineField } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: { name: '', email: '' },
});
```

### Field Registration

```typescript
// ❌ React
<input {...form.register('name')} />

// ✅ Vue
const [name, nameAttrs] = defineField('name');
// In template:
<input v-model="name" v-bind="nameAttrs" />
```

### Form Submission

```typescript
// ❌ React
const onSubmit = form.handleSubmit((values) => {
  // handle submit
});

// ✅ Vue
const onSubmit = handleSubmit((values) => {
  // handle submit
});
```

### Form Reset

```typescript
// ❌ React
form.reset();
form.reset({ name: 'New name' });

// ✅ Vue
resetForm();
resetForm({ values: { name: 'New name' } });
```

### Watch Form Values

```typescript
// ❌ React
const watchedName = form.watch('name');

// ✅ Vue
import { watch } from 'vue';

watch(
  () => values.name,
  (newValue) => {
    console.log('Name changed:', newValue);
  },
);
```

---

## Using Schemas from Core

```vue
<script setup lang="ts">
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { organizationDetailsSchema } from '@auth0/universal-components-core';

// Convert Zod schema to vee-validate format
const { handleSubmit, errors, defineField } = useForm({
  validationSchema: toTypedSchema(organizationDetailsSchema),
  initialValues: props.organization,
});
</script>
```

---

## Form with Nested Objects

```vue
<script setup lang="ts">
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  branding: z.object({
    logo_url: z.string().url().optional(),
    colors: z.object({
      primary: z.string(),
      page_background: z.string(),
    }),
  }),
});

const { handleSubmit, defineField, errors } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: props.data,
});

// Access nested fields with dot notation
const [logoUrl] = defineField('branding.logo_url');
const [primaryColor] = defineField('branding.colors.primary');
const [backgroundColor] = defineField('branding.colors.page_background');
</script>

<template>
  <form @submit.prevent="handleSubmit((v) => emit('submit', v))">
    <TextField v-model="logoUrl" label="Logo URL" :error-text="errors['branding.logo_url']" />
    <TextField
      v-model="primaryColor"
      label="Primary Color"
      :error-text="errors['branding.colors.primary']"
    />
    <TextField
      v-model="backgroundColor"
      label="Background"
      :error-text="errors['branding.colors.page_background']"
    />
  </form>
</template>
```

---

## Form with Array Fields

```vue
<script setup lang="ts">
import { useFieldArray, useForm } from 'vee-validate';

const { handleSubmit } = useForm({
  initialValues: {
    emails: [{ value: '' }],
  },
});

const { fields, push, remove } = useFieldArray('emails');
</script>

<template>
  <form @submit.prevent="handleSubmit((v) => emit('submit', v))">
    <div v-for="(field, idx) in fields" :key="field.key">
      <TextField v-model="field.value.value" :label="`Email ${idx + 1}`" />
      <Button type="button" variant="ghost" @click="remove(idx)">Remove</Button>
    </div>
    <Button type="button" variant="outline" @click="push({ value: '' })"> Add Email </Button>
  </form>
</template>
```

---

## Form Actions Component

```vue
<!-- src/components/ui/FormActions.vue -->
<script setup lang="ts">
import { Button } from './Button.vue';
import { Spinner } from './Spinner.vue';

interface Props {
  isLoading?: boolean;
  readOnly?: boolean;
  submitText?: string;
  cancelText?: string;
  showCancel?: boolean;
  showUnsavedChanges?: boolean;
  hasUnsavedChanges?: boolean;
  unsavedChangesText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  readOnly: false,
  submitText: 'Save',
  cancelText: 'Discard',
  showCancel: true,
  showUnsavedChanges: false,
  hasUnsavedChanges: false,
  unsavedChangesText: 'Unsaved changes',
});

const emit = defineEmits<{
  cancel: [];
}>();

const isPreviousVisible = computed(() =>
  props.showUnsavedChanges ? props.showCancel && props.hasUnsavedChanges : props.showCancel,
);
</script>

<template>
  <div v-if="!readOnly" class="flex items-center justify-between gap-4 pt-4">
    <div class="flex items-center gap-2">
      <span v-if="showUnsavedChanges && hasUnsavedChanges" class="text-sm text-muted-foreground">
        {{ unsavedChangesText }}
      </span>
    </div>

    <div class="flex items-center gap-2">
      <Button
        v-if="showCancel"
        type="button"
        variant="outline"
        :disabled="isLoading || (showUnsavedChanges && !hasUnsavedChanges)"
        :class="{ invisible: showUnsavedChanges && !isPreviousVisible }"
        :aria-hidden="showUnsavedChanges && !isPreviousVisible"
        :tabindex="isPreviousVisible ? 0 : -1"
        @click="emit('cancel')"
      >
        {{ cancelText }}
      </Button>

      <Button type="submit" :disabled="isLoading">
        <Spinner v-if="isLoading" class="mr-2 size-4" />
        {{ submitText }}
      </Button>
    </div>
  </div>
</template>
```

---

## vee-validate API Quick Reference

| Function                     | Purpose                               |
| ---------------------------- | ------------------------------------- |
| `useForm(options)`           | Initialize form state                 |
| `handleSubmit(fn)`           | Create submit handler                 |
| `resetForm(opts?)`           | Reset form to initial values          |
| `setValues(values)`          | Set multiple field values             |
| `setFieldValue(name, value)` | Set single field value                |
| `validate()`                 | Trigger validation                    |
| `defineField(name)`          | Create reactive field with attributes |
| `useFieldArray(name)`        | Handle array fields                   |

### useForm Return Values

```typescript
const {
  handleSubmit, // (fn) => submitHandler
  resetForm, // (opts?) => void
  setValues, // (values) => void
  setFieldValue, // (name, value) => void
  validate, // () => Promise<{valid, errors}>
  values, // Reactive form values
  errors, // Reactive validation errors
  meta, // Form metadata (dirty, valid, touched)
  defineField, // (name) => [model, attrs]
} = useForm({ validationSchema, initialValues });
```
