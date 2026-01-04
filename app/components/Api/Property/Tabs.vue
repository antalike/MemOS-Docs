<script setup lang="ts">
const props = defineProps<{
  schemas: Record<string, unknown>[]
  parentProp?: string
}>()

const items = computed(() => {
  return props.schemas
    .filter((subParam) => {
      const obj = subParam as Record<string, unknown>
      return obj && obj.properties
    })
    .map((subParam, index) => {
      const obj = subParam as Record<string, unknown>
      return {
        label: (obj.title as string) || `Option ${index + 1}`,
        slot: 'item',
        schemaData: obj
      }
    })
})
</script>

<template>
  <div class="mt-4 rounded-xl border border-gray-100 px-4 pb-4 pt-2 dark:border-gray-800">
    <UTabs
      :items="items"
      variant="link"
      class="mt-4"
      :ui="{
        list: 'overflow-x-auto flex-nowrap w-full scrollbar-hide',
        trigger: 'whitespace-nowrap flex-shrink-0 data-[state=active]:text-primary-light cursor-pointer',
        indicator: 'bg-primary-500 dark:bg-primary-light h-[2px] bottom-0'
      }"
    >
      <template #item="{ item }">
        <ApiCollapse
          v-if="item.schemaData && item.schemaData.properties"
          class="mt-4"
        >
          <ApiPropertyList
            :properties="item.schemaData.properties as Record<string, SchemaObject>"
            :required="item.schemaData.required as string[]"
            :parent-prop="parentProp"
            :enable-any-of-select="true"
          />
        </ApiCollapse>
      </template>
    </UTabs>
  </div>
</template>
