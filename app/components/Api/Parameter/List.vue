<script setup lang="ts">
import type { SchemaObject } from '~/utils/openapi'

defineProps<{
  title: string
  params: ParameterObject[]
}>()

defineOptions({
  inheritAttrs: false
})
</script>

<template>
  <div v-if="params && params.length">
    <ApiSectionHeader :title="title" />
    <template
      v-for="(param, index) in params"
      :key="index"
    >
      <div class="border-gray-100 dark:border-gray-800 border-b last:border-b-0">
        <div class="py-6">
          <ApiParameterLine
            v-bind="$attrs"
            :name="param.name"
            :required="param.required"
            :schema="param.schema as SchemaObject"
            :default-value="(param.schema as SchemaObject)?.default"
            :in="(param.in as 'query' | 'header' | 'path' | 'cookie')"
          />
          <div class="mt-3">
            <ApiParameterDetails
              :description="param.description"
              :schema="param.schema as SchemaObject"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
