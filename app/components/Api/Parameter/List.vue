<script setup lang="ts">
import type { ParametersProp } from './index.vue'

defineProps<{
  title: string
  data: ParametersProp[]
}>()

defineOptions({
  inheritAttrs: false
})
</script>

<template>
  <div>
    <ApiSectionHeader :title="title" />
    <template
      v-for="(param, index) in data"
      :key="index"
    >
      <div class="border-gray-100 dark:border-gray-800 border-b last:border-b-0">
        <div class="py-6">
          <ApiParameterLine
            v-bind="$attrs"
            :name="param.name"
            :required="param.required"
            :schema="param.schema"
          />
        </div>
      </div>
    </template>
  </div>
</template>
