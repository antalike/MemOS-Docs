<script setup lang="ts">
defineProps<{
  properties: {
    [name: string]: SchemaObject
  }
  required?: string[] | undefined
  parentProp?: string | undefined
}>()
</script>

<template>
  <div>
    <template
      v-for="(param, prop) in properties"
      :key="prop"
    >
      <ApiRequestBodyParam
        :schema="param"
        :prop="prop"
        :required="required"
        :parent-prop="parentProp"
      />
    </template>
  </div>
</template>
