<script setup lang="ts">
defineProps<{
  properties: {
    [name: string]: SchemaObject
  }
  required?: string[] | undefined
  parentProp?: string | undefined
  enableAnyOfSelect?: boolean
}>()
</script>

<template>
  <div>
    <template
      v-for="(param, prop) in properties"
      :key="prop"
    >
      <ApiPropertyParam
        :schema="param"
        :prop="prop"
        :required="required"
        :parent-prop="parentProp"
        :enable-any-of-select="enableAnyOfSelect"
      />
    </template>
  </div>
</template>
