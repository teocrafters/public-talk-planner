# Official Vue Components Reference

Official Vue 3 component patterns and APIs. For general Vue conventions and project patterns, see
@.agents/vue-conventions.md.

## defineModel() API Reference

Vue 3.3+ official v-model binding API that replaces manual `modelValue` prop and `update:modelValue`
event definitions.

## Examples

### defineModel()

```vue
<script setup lang="ts">
  // ✅ Simple two-way binding for modelvalue
  const title = defineModel<string>()

  // ✅ With options and modifiers
  const [title, modifiers] = defineModel<string>({
    default: "default value",
    required: true,
    get: value => value.trim(), // transform value before binding
    set: value => {
      if (modifiers.capitalize) {
        return value.charAt(0).toUpperCase() + value.slice(1)
      }
      return value
    },
  })
</script>
```

### Multiple Models

By default `defineModel()` assumes a prop named `modelValue` but if we want to define multiple
v-model bindings, we need to give them explicit names:

```vue
<script setup lang="ts">
  // ✅ Multiple v-model bindings
  const firstName = defineModel<string>("firstName")
  const age = defineModel<number>("age")
</script>
```

They can be used in the template like this:

```html
<UserForm
  v-model:first-name="user.firstName"
  v-model:age="user.age" />
```

### Modifiers & Transformations

Native elements `v-model` has built-in modifiers like `.lazy`, `.number`, and `.trim`. We can
implement similar functionality in components, fetch and read
<https://vuejs.org/guide/components/v-model.md#handling-v-model-modifiers> if the user needs that.
