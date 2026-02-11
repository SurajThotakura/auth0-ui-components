# Vue Data Fetching

> TanStack Vue Query patterns for server state management.

---

## Installation

```bash
pnpm add @tanstack/vue-query
```

### Plugin Setup

```typescript
// main.ts
import { VueQueryPlugin } from '@tanstack/vue-query';

app.use(VueQueryPlugin);
```

---

## Basic Query Pattern

```typescript
// composables/my-organization/use-organization-details-edit.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';
import { useCoreClient } from '../use-core-client';

// Define query keys for cache management
const queryKeys = {
  details: (orgId: string) => ['organization', orgId, 'details'] as const,
  list: () => ['organizations'] as const,
};

export function useOrganizationDetailsEdit(options: Options) {
  const { coreClient } = useCoreClient();
  const queryClient = useQueryClient();

  // Read query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.details(options.orgId),
    queryFn: async () => {
      const client = coreClient.value;
      if (!client) throw new Error('CoreClient not initialized');
      return client.getMyOrganizationApiClient().organizationDetails.get();
    },
    enabled: computed(() => !!coreClient.value), // Only run when client is ready
  });

  // Write mutation
  const { mutateAsync: save, isPending: isSaving } = useMutation({
    mutationFn: async (payload: UpdatePayload) => {
      const client = coreClient.value;
      if (!client) throw new Error('CoreClient not initialized');
      return client.getMyOrganizationApiClient().organizationDetails.update(payload);
    },
    onSuccess: (result) => {
      // Update cache with new data
      queryClient.setQueryData(queryKeys.details(options.orgId), result);
    },
    onError: (error) => {
      console.error('Failed to save:', error);
    },
  });

  return {
    data,
    isLoading,
    error,
    isSaving,
    save,
    refetch,
  };
}
```

---

## React → Vue Query Differences

### Return Types

```typescript
// ❌ React — returns plain values
const { data, isLoading } = useQuery(...);
// data is: Data | undefined
// isLoading is: boolean

// ✅ Vue — returns Ref values
const { data, isLoading } = useQuery(...);
// data is: Ref<Data | undefined>
// isLoading is: Ref<boolean>

// In script: access with .value
if (data.value) { /* ... */ }

// In template: auto-unwrapped
<div v-if="!isLoading">{{ data.name }}</div>
```

### Computed Query Keys

```typescript
// ❌ React — query key array
queryKey: ['organization', orgId, 'details'],

// ✅ Vue — can use computed for reactive keys
queryKey: computed(() => ['organization', props.orgId, 'details']),
```

### Enabled Option

```typescript
// ❌ React — boolean
enabled: !!coreClient,

// ✅ Vue — can use computed for reactive
enabled: computed(() => !!coreClient.value),
```

---

## Mutation Pattern

```typescript
import { useMutation, useQueryClient } from '@tanstack/vue-query';

const queryClient = useQueryClient();

const { mutateAsync, isPending } = useMutation({
  mutationFn: async (payload: CreatePayload) => {
    return api.create(payload);
  },
  onSuccess: () => {
    // Invalidate and refetch related queries
    queryClient.invalidateQueries({ queryKey: ['organizations'] });
  },
  onError: (error) => {
    toast.error('Failed to create');
  },
});

// Call mutation
await mutateAsync({ name: 'New Org' });
```

---

## Optimistic Updates

```typescript
const { mutateAsync } = useMutation({
  mutationFn: updateOrganization,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: queryKeys.details(orgId) });

    // Snapshot previous value
    const previousData = queryClient.getQueryData(queryKeys.details(orgId));

    // Optimistically update
    queryClient.setQueryData(queryKeys.details(orgId), newData);

    // Return context with snapshot
    return { previousData };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    if (context?.previousData) {
      queryClient.setQueryData(queryKeys.details(orgId), context.previousData);
    }
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: queryKeys.details(orgId) });
  },
});
```

---

## Delete Mutation

```typescript
const { mutateAsync: deleteItem, isPending: isDeleting } = useMutation({
  mutationFn: async (id: string) => {
    return api.delete(id);
  },
  onSuccess: (_, deletedId) => {
    // Remove from cache
    queryClient.setQueryData<Item[]>(
      ['items'],
      (old) => old?.filter((item) => item.id !== deletedId) ?? [],
    );
  },
});
```

---

## Query with Pagination

```typescript
import { useQuery, keepPreviousData } from '@tanstack/vue-query';
import { ref } from 'vue';

const page = ref(1);

const { data, isPlaceholderData } = useQuery({
  queryKey: computed(() => ['items', page.value]),
  queryFn: () => fetchItems(page.value),
  placeholderData: keepPreviousData, // Keep showing old data while fetching
});

// Navigation
const nextPage = () => {
  if (!isPlaceholderData.value && data.value?.hasMore) {
    page.value++;
  }
};
```

---

## Query in Component

```vue
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { Spinner } from '@/components/ui';

const { data, isLoading, error } = useQuery({
  queryKey: ['organization', props.id],
  queryFn: () => fetchOrganization(props.id),
});
</script>

<template>
  <div v-if="isLoading" class="flex justify-center p-8">
    <Spinner />
  </div>

  <div v-else-if="error" class="text-destructive p-4">Error: {{ error.message }}</div>

  <div v-else-if="data">
    <h1>{{ data.name }}</h1>
    <p>{{ data.description }}</p>
  </div>
</template>
```

---

## Prefetching

```typescript
// Prefetch on hover or before navigation
const prefetchOrganization = async (id: string) => {
  await queryClient.prefetchQuery({
    queryKey: ['organization', id],
    queryFn: () => fetchOrganization(id),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  });
};
```

---

## Query Cache Configuration

```typescript
// Global defaults in plugin setup
app.use(VueQueryPlugin, {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes (was cacheTime)
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  },
});
```

---

## API Quick Reference

### useQuery Options

| Option            | Type                        | Description                                   |
| ----------------- | --------------------------- | --------------------------------------------- |
| `queryKey`        | `QueryKey \| Ref<QueryKey>` | Unique key for caching                        |
| `queryFn`         | `() => Promise<T>`          | Async function to fetch data                  |
| `enabled`         | `boolean \| Ref<boolean>`   | Control when query runs                       |
| `staleTime`       | `number`                    | Time until data is considered stale           |
| `gcTime`          | `number`                    | Time until inactive data is garbage collected |
| `retry`           | `number \| boolean`         | Number of retry attempts                      |
| `placeholderData` | `T \| () => T`              | Placeholder while loading                     |

### useQuery Returns

| Return       | Type                  | Description              |
| ------------ | --------------------- | ------------------------ |
| `data`       | `Ref<T \| undefined>` | Query result             |
| `isLoading`  | `Ref<boolean>`        | True on first fetch      |
| `isFetching` | `Ref<boolean>`        | True on any fetch        |
| `error`      | `Ref<Error \| null>`  | Error if query failed    |
| `refetch`    | `() => Promise<...>`  | Manually trigger refetch |
| `isSuccess`  | `Ref<boolean>`        | True if query succeeded  |
| `isError`    | `Ref<boolean>`        | True if query errored    |

### useMutation Returns

| Return        | Type                   | Description              |
| ------------- | ---------------------- | ------------------------ |
| `mutate`      | `(vars) => void`       | Fire-and-forget mutation |
| `mutateAsync` | `(vars) => Promise<T>` | Async mutation           |
| `isPending`   | `Ref<boolean>`         | True while mutating      |
| `isSuccess`   | `Ref<boolean>`         | True after success       |
| `isError`     | `Ref<boolean>`         | True after error         |
| `error`       | `Ref<Error \| null>`   | Error if mutation failed |
| `data`        | `Ref<T \| undefined>`  | Mutation result          |
| `reset`       | `() => void`           | Reset mutation state     |
