<script setup lang="ts">
const props = defineProps<{
  prop: string
  param: PropertyProps | undefined
  required: string[] | undefined
  parentProp: string | undefined
}>()

const properties = computed(() => {
  if (!props.param) return null
  if (props.param?.properties) return props.param.properties
  if (props.param.anyOf) {
    return props.param.anyOf.filter(item => Object.prototype.hasOwnProperty.call(item, 'properties'))?.[0]?.properties
  }
  return null
})

function isRequired(list: string[] | undefined | null, prop: string) {
  if (!list) return false
  return list.includes(prop)
}
</script>

<template>
  <div
    v-if="param"
    class="border-gray-100 dark:border-gray-800 border-b last:border-b-0"
  >
    <div class="py-6">
      <ApiParameterLine
        :name="prop"
        :parent-name="parentProp"
        :default-value="param.default"
        :param="param"
        :required="isRequired(required, prop)"
      />
      <div class="mt-4">
        <p
          v-if="param.description"
          class="whitespace-pre-line text-gray-400 text-sm"
        >
          {{ param.description }}
        </p>
        <!-- Handle anyOf -->
        <ApiRequestBodyArrayParam
          v-if="param.anyOf?.length"
          :any-of="param.anyOf"
        />
        <!-- Handle Items -->
        <ApiRequestBodyArrayParam
          v-if="param.items"
          :items="param.items"
        />
        <ApiParameterExample :value="param.example" />
      </div>
      <template v-if="properties">
        <ApiCollapse class="mt-4">
          <ApiRequestBodyList
            :properties="properties"
            :required="param.required"
            :parent-prop="prop"
          />
        </ApiCollapse>
      </template>
    </div>
  </div>
</template>
