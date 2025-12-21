# Vue 3 Components Quick Reference

Quick reference for Vue 3 component APIs and project-specific patterns.

**For complete Vue 3 documentation, use Context7 to query official docs.**

## Project-Specific Notes

- **Always use**: `<script setup lang="ts">` syntax (Composition API)
- **Reference project patterns**: `.agents/vue-conventions.md`

## defineModel() Quick Reference

Vue 3.3+ API for two-way binding (replaces manual modelValue prop/emit).

### Simple Model

```vue
<script setup lang="ts">
  const title = defineModel<string>()
</script>
```

### Multiple Models

```vue
<script setup lang="ts">
  const firstName = defineModel<string>("firstName")
  const age = defineModel<number>("age")
</script>

<!-- Parent usage -->
<UserForm v-model:first-name="user.firstName" v-model:age="user.age" />
```

## Context7 References

**For comprehensive documentation, query via Context7**:

- **Vue 3 Composition API**: defineProps, defineEmits, defineModel
- **Vue 3 Components**: Props, emits, slots, lifecycle
- **Vue 3 Reactivity**: ref, reactive, computed, watch
- **Vue 3 Advanced**: Teleport, Suspense, custom directives

**Query examples**:

- "Vue 3 defineModel with modifiers"
- "Vue 3 Composition API lifecycle hooks"
- "Vue 3 provide/inject patterns"

## References

- Project Vue patterns: `.agents/vue-conventions.md`
- Official Vue 3 docs: Use Context7
