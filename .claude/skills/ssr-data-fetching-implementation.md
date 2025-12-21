# SSR Data Fetching Implementation Skill

Guides through proper Server-Side Rendering compatible data fetching in Nuxt 4 components.

## Purpose

USE this skill when:

- Fetching data in Vue components
- Adding API calls to pages or components
- Implementing data-driven UI
- Converting client-only fetching to SSR

DO NOT use this skill for:

- Server-side API routes (use direct queries)
- Static data (use constants or imports)
- Non-HTTP async operations (use useAsyncData)

## Critical Rules

⛔ **ALWAYS use useFetch() or useAsyncData()** - NEVER use raw $fetch() in components
⛔ **ALWAYS await the composable** - Required for proper SSR hydration
⛔ **ALWAYS handle loading and error states** - Provide good UX

## Why SSR Data Fetching Matters

**Server-Side Rendering (SSR)** means:
1. Server fetches data and renders HTML with it
2. Client receives fully rendered HTML (instant content)
3. Vue hydrates the HTML (makes it interactive)
4. No loading spinner on initial page load

**Benefits**:
- **SEO**: Search engines see fully rendered content with data
- **Performance**: Faster initial page load, better Core Web Vitals
- **UX**: No loading flicker, content appears immediately
- **Accessibility**: Content available even if JavaScript fails

**Problem with $fetch()**:
- $fetch() runs only on client (not during SSR)
- Server renders without data → HTML is empty
- Client fetches and re-renders → loading flicker
- Search engines see empty page → poor SEO

## Workflow Steps

### Step 1: Identify Data Fetching Need

**Goal**: Determine what data needs to be fetched.

**Actions**:

1. Analyze component requirements:
   - What API endpoint provides the data?
   - What TypeScript type represents the data?
   - Is data for list or single item?
2. Check if data is:
   - Simple API call → Use `useFetch()`
   - Complex async operation → Use `useAsyncData()`
   - Multiple parallel requests → Multiple `useFetch()` calls

**Output**: Clear understanding of data fetching requirements.

---

### Step 2: Choose Fetching Strategy

**Goal**: Select appropriate composable (useFetch vs useAsyncData).

**Decision Tree**:

```
Is it a simple API call?
  ├─ YES → Use useFetch()
  │         - GET request
  │         - No custom headers
  │         - Single endpoint
  │
  └─ NO → Use useAsyncData()
            - Custom headers needed
            - Non-HTTP async operation
            - Multiple data sources combined
            - More control over caching
```

**Output**: Selected composable to use.

---

### Step 3: Implement useFetch() Pattern

**Goal**: Implement SSR-compatible data fetching with useFetch.

**Template**:

```vue
<script setup lang="ts">
import type { TypeName } from "~/server/database/schema"

// ✅ CORRECT: useFetch with await
const {
  data: variableName,
  pending,
  error,
  refresh
} = await useFetch<TypeName[]>("/api/endpoint")

// Destructured values:
// - data: Reactive reference to fetched data (null until loaded)
// - pending: Boolean - true while fetching
// - error: Error object if request fails (null on success)
// - refresh: Function to manually refetch data
</script>

<template>
  <!-- Handle loading state -->
  <div v-if="pending">
    Loading...
  </div>

  <!-- Handle error state -->
  <div v-else-if="error">
    <UAlert
      color="error"
      :title="error.message" />
  </div>

  <!-- Handle success state -->
  <div v-else-if="variableName">
    <div
      v-for="item in variableName"
      :key="item.id">
      {{ item.name }}
    </div>
  </div>
</template>
```

**Validation Checklist**:
- [ ] `await` keyword present before `useFetch`
- [ ] TypeScript type provided: `useFetch<Type>`
- [ ] Destructured `data`, `pending`, `error`
- [ ] Loading state handled in template (`v-if="pending"`)
- [ ] Error state handled in template (`v-else-if="error"`)
- [ ] Success state uses optional chaining or v-if check

**Output**: useFetch implementation with proper error/loading handling.

---

### Step 4: Implement useAsyncData() Pattern (If Needed)

**Goal**: Implement useAsyncData for complex scenarios.

**Template**:

```vue
<script setup lang="ts">
// ✅ CORRECT: useAsyncData with await
const {
  data: variableName,
  pending,
  error,
  refresh
} = await useAsyncData(
  "unique-cache-key", // Unique key for caching
  () => $fetch("/api/endpoint", {
    headers: {
      "X-Custom-Header": "value"
    }
  })
)

// Or combine multiple data sources:
const { data: combined } = await useAsyncData(
  "dashboard-data",
  async () => {
    const [talks, speakers] = await Promise.all([
      $fetch("/api/talks"),
      $fetch("/api/speakers")
    ])
    return { talks, speakers }
  }
)
</script>
```

**When to use**:
- Custom fetch options (headers, method, etc.)
- Non-HTTP async operations
- Combining multiple data sources
- More control over caching with unique keys

**Output**: useAsyncData implementation.

---

### Step 5: Verify SSR Hydration

**Goal**: Ensure data fetching works correctly with SSR.

**Verification Steps**:

1. Check `await` keyword:
   ```vue
   <script setup lang="ts">
   // ✅ CORRECT
   const { data } = await useFetch("/api/speakers")

   // ❌ WRONG - Missing await
   const { data } = useFetch("/api/speakers")
   </script>
   ```

2. Verify destructuring:
   ```vue
   <script setup lang="ts">
   // ✅ CORRECT - All states accessible
   const { data, pending, error, refresh } = await useFetch(...)

   // ⚠️ INCOMPLETE - Missing error handling
   const { data } = await useFetch(...)
   </script>
   ```

3. Check template state handling:
   ```vue
   <template>
     <!-- ✅ CORRECT - All states handled -->
     <div v-if="pending">Loading...</div>
     <div v-else-if="error">Error</div>
     <div v-else>Content</div>

     <!-- ❌ WRONG - No loading/error handling -->
     <div>{{ data }}</div>
   </template>
   ```

**Output**: SSR hydration verified OR issues identified.

---

### Step 6: Test SSR Behavior

**Goal**: Verify data fetching works in both SSR and client modes.

**Testing Guide**:

```
🧪 SSR Data Fetching Test

Test in development mode:

1. Start dev server: pnpm dev
2. Navigate to the page in browser
3. Check Network tab (F12 → Network):
   - Should NOT see API request on initial load
   - Data already included in server HTML
4. Check page source (View Page Source):
   - Look for data in HTML (not just empty divs)
5. Disable JavaScript and reload:
   - Content should still be visible (SSR working)

Expected behavior:
✅ Data visible immediately (no loading spinner)
✅ No API request on initial page load
✅ Content in page source HTML
✅ Works with JavaScript disabled

If you see:
❌ Loading spinner on initial load → SSR not working
❌ API request in Network tab → Using client-only fetching
❌ Empty page source → Not using useFetch/useAsyncData
```

**Output**: SSR confirmed working OR issues to fix.

---

### Step 7: Optimize Performance

**Goal**: Ensure efficient data fetching patterns.

**Optimization Checklist**:

```vue
<script setup lang="ts">
// ✅ CORRECT: Parallel requests (execute simultaneously)
const { data: speakers } = await useFetch<Speaker[]>("/api/speakers")
const { data: talks } = await useFetch<Talk[]>("/api/talks")
// Both requests run in parallel during SSR

// ❌ WRONG: Sequential requests (slow)
const { data: speakers } = await useFetch("/api/speakers")
// Wait for speakers to complete...
const { data: talks } = await useFetch("/api/talks")
// Then fetch talks (slower!)

// ✅ CORRECT: Reactive refetching
const route = useRoute()
const { data: speaker } = await useFetch(
  () => `/api/speakers/${route.params.id}`
)
// Automatically refetches when route.params.id changes

// ✅ CORRECT: Manual refresh when data changes
const { data: speakers, refresh } = await useFetch("/api/speakers")

async function handleSpeakerCreated() {
  await refresh() // Refetch speakers list
}
</script>
```

**Performance Tips**:
- Fetch multiple resources in parallel
- Use reactive fetching for dynamic routes
- Use `refresh()` to update data after mutations
- Provide TypeScript types for better tree-shaking

**Output**: Optimized data fetching implementation.

---

## Common Scenarios

### Scenario 1: Simple List Page

**Requirement**: Display list of speakers

```vue
<script setup lang="ts">
import type { Speaker } from "~/server/database/schema"

const { data: speakers, pending, error } = await useFetch<Speaker[]>("/api/speakers")
</script>

<template>
  <div v-if="pending">Loading speakers...</div>
  <div v-else-if="error">Failed to load speakers</div>
  <div v-else-if="speakers">
    <SpeakerCard
      v-for="speaker in speakers"
      :key="speaker.id"
      :speaker="speaker" />
  </div>
</template>
```

### Scenario 2: Detail Page with Dynamic Route

**Requirement**: Display single speaker by ID

```vue
<script setup lang="ts">
import type { Speaker } from "~/server/database/schema"

const route = useRoute()

// Reactive fetching - refetches when route.params.id changes
const { data: speaker, pending, error } = await useFetch<Speaker>(
  () => `/api/speakers/${route.params.id}`
)
</script>

<template>
  <div v-if="pending">Loading...</div>
  <div v-else-if="error">Speaker not found</div>
  <div v-else-if="speaker">
    <h1>{{ speaker.firstName }} {{ speaker.lastName }}</h1>
  </div>
</template>
```

### Scenario 3: Dashboard with Multiple Data Sources

**Requirement**: Fetch speakers and talks in parallel

```vue
<script setup lang="ts">
import type { Speaker, Talk } from "~/server/database/schema"

// Parallel fetching (both execute simultaneously)
const { data: speakers, pending: speakersPending } = await useFetch<Speaker[]>("/api/speakers")
const { data: talks, pending: talksPending } = await useFetch<Talk[]>("/api/talks")

// Combined loading state
const loading = computed(() => speakersPending.value || talksPending.value)
</script>

<template>
  <div v-if="loading">Loading dashboard...</div>
  <div v-else>
    <SpeakersList :speakers="speakers" />
    <TalksList :talks="talks" />
  </div>
</template>
```

### Scenario 4: Custom Headers (useAsyncData)

**Requirement**: Fetch with authentication header

```vue
<script setup lang="ts">
const { data: profile } = await useAsyncData(
  "user-profile",
  () => $fetch("/api/user/profile", {
    headers: {
      "Authorization": `Bearer ${token.value}`
    }
  })
)
</script>
```

---

## Anti-Patterns (NEVER DO THIS)

### ❌ Using $fetch() Directly

```vue
<script setup lang="ts">
// WRONG: Direct $fetch() in component
const speakers = await $fetch("/api/speakers")
// Problem: No SSR, no loading state, no error handling

// CORRECT: Use useFetch
const { data: speakers, pending, error } = await useFetch<Speaker[]>("/api/speakers")
</script>
```

### ❌ Fetching in onMounted

```vue
<script setup lang="ts">
// WRONG: Fetching in lifecycle hook defeats SSR
const speakers = ref([])
onMounted(async () => {
  speakers.value = await $fetch("/api/speakers")
})

// CORRECT: Use useFetch at top level
const { data: speakers } = await useFetch<Speaker[]>("/api/speakers")
</script>
```

### ❌ Not Awaiting useFetch

```vue
<script setup lang="ts">
// WRONG: Missing await breaks SSR hydration
const { data } = useFetch("/api/speakers")

// CORRECT: Always await
const { data } = await useFetch("/api/speakers")
</script>
```

### ❌ No Error/Loading Handling

```vue
<template>
  <!-- WRONG: No loading or error states -->
  <div v-for="speaker in speakers">
    {{ speaker.firstName }}
  </div>

  <!-- CORRECT: All states handled -->
  <div v-if="pending">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <div v-else-if="speakers">
    <div v-for="speaker in speakers" :key="speaker.id">
      {{ speaker.firstName }}
    </div>
  </div>
</template>
```

### ❌ Sequential Fetching (Slow)

```vue
<script setup lang="ts">
// WRONG: Sequential (second waits for first)
const { data: speakers } = await useFetch("/api/speakers")
const { data: talks } = await useFetch("/api/talks")

// CORRECT: Parallel (both execute together)
// Just declare both awaits at top level - they run in parallel
const { data: speakers } = await useFetch("/api/speakers")
const { data: talks } = await useFetch("/api/talks")
</script>
```

---

## Verification Checklist

```
✅ SSR Data Fetching Implementation Checklist

Data Fetching:
□ Using useFetch() or useAsyncData() (NOT $fetch)
□ Await keyword present: await useFetch(...)
□ TypeScript type provided: useFetch<Type>(...)
□ Destructured: { data, pending, error, refresh }

Template:
□ Loading state: v-if="pending"
□ Error state: v-else-if="error"
□ Success state: v-else-if="data"
□ Optional chaining or null check: data?.property

Performance:
□ Multiple requests run in parallel (not sequential)
□ Reactive fetching for dynamic routes: () => `/api/${route.params.id}`
□ Manual refresh implemented where needed

SSR Verification:
□ No loading spinner on initial page load
□ Data visible in page source HTML
□ No API request on initial load (check Network tab)

All items checked → SSR data fetching implemented correctly!
```

---

## Common Issues and Solutions

### Issue: Loading spinner appears on initial load

**Symptom**: Flicker, loading state visible even though SSR should prevent it

**Diagnosis**:
```vue
<script setup lang="ts">
// Check 1: Is await present?
const { data } = useFetch("/api/speakers") // ❌ Missing await!

// Check 2: Is it in onMounted?
onMounted(async () => {
  const { data } = await useFetch("/api/speakers") // ❌ Wrong place!
})
</script>
```

**Solution**:
```vue
<script setup lang="ts">
// ✅ Add await at top level
const { data: speakers, pending, error } = await useFetch<Speaker[]>("/api/speakers")
</script>
```

### Issue: Data is undefined on server

**Symptom**: `data` is null even after SSR

**Diagnosis**:
```vue
<template>
  <!-- Error: Cannot read properties of undefined -->
  <div>{{ data.firstName }}</div>
</template>
```

**Solution**:
```vue
<template>
  <!-- ✅ Always check data exists -->
  <div v-if="data">{{ data.firstName }}</div>

  <!-- Or use optional chaining -->
  <div>{{ data?.firstName }}</div>
</template>
```

### Issue: TypeScript errors with data access

**Symptom**: `Property 'firstName' does not exist on type 'unknown'`

**Diagnosis**:
```vue
<script setup lang="ts">
// Missing TypeScript type
const { data } = await useFetch("/api/speakers")
// TypeScript doesn't know what type 'data' is
</script>
```

**Solution**:
```vue
<script setup lang="ts">
import type { Speaker } from "~/server/database/schema"

// ✅ Provide explicit type
const { data: speakers } = await useFetch<Speaker[]>("/api/speakers")
// Now TypeScript knows speakers is Speaker[] | null
</script>
```

### Issue: Data doesn't update after mutation

**Symptom**: Created new speaker but list doesn't show it

**Solution**:
```vue
<script setup lang="ts">
const { data: speakers, refresh } = await useFetch<Speaker[]>("/api/speakers")

async function handleSpeakerCreated() {
  // After successful creation
  await refresh() // ✅ Refetch data
}
</script>
```

---

## Examples from Codebase

### Real Example: Speakers List Page

```vue
<!-- app/pages/speakers.vue -->
<script setup lang="ts">
import type { Speaker } from "~/server/database/schema"

// Fetch speakers list
const { data: speakers, pending, error, refresh } = await useFetch<Speaker[]>("/api/speakers")

// Permissions check (separate composable)
const { canManageSpeakers } = usePermissions()

// Data is fetched on server during SSR
// Client receives pre-rendered HTML with speakers
// No loading flicker on initial page load
</script>

<template>
  <div v-if="pending">
    <USkeleton v-for="i in 5" :key="i" class="h-20 mb-4" />
  </div>

  <div v-else-if="error">
    <UAlert color="error" title="Failed to load speakers" />
  </div>

  <div v-else-if="speakers">
    <SpeakerCard
      v-for="speaker in speakers"
      :key="speaker.id"
      :speaker="speaker"
      @refresh="refresh" />
  </div>
</template>
```

**Key Points from Real Implementation**:
- TypeScript types from schema
- All states handled (pending, error, success)
- Refresh function passed to child components
- Permissions fetched separately (client-side)
- SSR for data, client-side for user-specific features

---

## Why This Skill Matters

- **PREVENTS SEO ISSUES**: Ensures search engines see full content
- **IMPROVES PERFORMANCE**: Faster initial page loads
- **ENSURES CORRECTNESS**: Proper hydration prevents bugs
- **MAINTAINS STANDARDS**: Consistent pattern across application

## Migration Guide

### Converting Client-Only to SSR

**Before (Client-only)**:
```vue
<script setup lang="ts">
const speakers = ref<Speaker[]>([])

onMounted(async () => {
  speakers.value = await $fetch("/api/speakers")
})
</script>
```

**After (SSR-compatible)**:
```vue
<script setup lang="ts">
const { data: speakers, pending, error } = await useFetch<Speaker[]>("/api/speakers")
</script>

<template>
  <div v-if="pending">Loading...</div>
  <div v-else-if="error">Error</div>
  <div v-else-if="speakers">
    <!-- Content -->
  </div>
</template>
```

**Changes**:
1. Removed `ref()` and `onMounted`
2. Added `useFetch` with `await`
3. Added loading and error states
4. Added TypeScript type

## References

- Frontend guidelines: `app/AGENTS.md`
- Vue conventions: `.agents/vue-conventions.md`
- Nuxt SSR documentation: Official docs (Context7)
