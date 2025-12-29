---
description: Implement Vue Provide/Inject Pattern for Dependency Injection in Astro + Vue
---
# Implement Vue Provide/Inject Pattern

This workflow outlines the steps to implement the Provide/Inject pattern in an Astro + Vue application to share global dependencies (Supabase, Auth, etc.) without prop drilling.

## 1. Create Injection Keys

Create a file `src/types/injection-keys.ts` to define typed injection keys.

```typescript
import type { InjectionKey } from 'vue';
import type { SupabaseClient } from '@supabase/supabase-js';

// Define keys using Symbol for uniqueness
export const supabaseKey: InjectionKey<SupabaseClient> = Symbol('supabase');
// Add other keys as needed
```

## 2. Create Root Provider Component

Create `src/components/providers/AppProvider.vue`. This component will:
- Accept configuration props from Astro (e.g. `supabaseUrl`).
- Initialize clients/state.
- Provide dependencies using `provide()`.

```vue
<script setup lang="ts">
import { provide } from 'vue';
import { supabaseKey } from '@/types/injection-keys';
// ... other imports

const props = defineProps<{
  supabaseUrl: string;
  supabaseAnonKey: string;
}>();

// Initialize client
const supabase = createClient(props.supabaseUrl, props.supabaseAnonKey);

// Provide
provide(supabaseKey, supabase);
</script>

<template>
  <slot />
</template>
```

## 3. Create Composables

Create composables to easily inject dependencies with type safety and runtime checks.

**Example: `src/composables/useSupabase.ts`**
```typescript
import { inject } from 'vue';
import { supabaseKey } from '@/types/injection-keys';

export function useSupabase() {
  const supabase = inject(supabaseKey);
  if (!supabase) {
    throw new Error('useSupabase() must be used within an <AppProvider>');
  }
  return supabase;
}
```

## 4. Integrate into Astro Layout

Wrap your application in the provider within your main Astro layout (e.g., `BaseLayout.astro`).

```astro
---
import AppProvider from '@/components/providers/AppProvider.vue';
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;
---
<body>
  <AppProvider 
    client:only="vue" 
    supabaseUrl={supabaseUrl} 
    supabaseAnonKey={supabaseAnonKey}
  >
    <slot />
  </AppProvider>
</body>
```
**Note:** Use `client:only="vue"` to ensure the Vue provider initializes correctly on the client.

## 5. Refactor Components

Is your components:
1. Remove props used for dependency injection (e.g., `supabaseUrl`).
2. Use the composable to get the dependency.

```vue
<script setup lang="ts">
import { useSupabase } from '@/composables/useSupabase';

// ✅ Clean injection
const supabase = useSupabase(); 
</script>
```

## 6. Cleanup Astro Pages

Stop passing environment variables/dependencies as props from Astro pages to Vue components.
