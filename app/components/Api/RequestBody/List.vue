<script setup lang="ts">
defineProps<{
  properties: Record<string, { $ref: string } | PropertyProps>
  required?: string[] | undefined
  parentProp?: string | undefined
}>()

defineOptions({
  inheritAttrs: false
})
</script>

<template>
  <template
    v-for="(param, prop) in properties"
    :key="prop"
  >
    <ApiRequestBodyParam
      v-bind="$attrs"
      :param="param"
      :prop="prop"
      :required="required"
      :parent-prop="parentProp"
    />
  </template>
</template>
