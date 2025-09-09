<script setup lang="ts">
import { resolveSchemaRef } from '@/utils/openapi'

const props = defineProps<{
  prop: string
  param: { $ref: string } | PropertyProps | undefined
  required: string[] | undefined
  parentProp: string | undefined
}>()

const { schemas } = useOpenApi()

const computedParam = computed(() => {
  if (props.param?.$ref) {
    const ref = resolveSchemaRef(props.param.$ref, schemas.value)
    return ref as any
  }

  return props.param
})

function isRequired(list: string[] | undefined | null, prop: string) {
  if (!list) return false
  return list.includes(prop)
}
</script>

<template>
  <div
    v-if="computedParam"
    class="border-gray-100 dark:border-gray-800 border-b last:border-b-0"
  >
    <div class="py-6">
      <ApiParameterLine
        :name="prop"
        :parent-name="parentProp"
        :default-value="computedParam.default"
        :schema="computedParam"
        :required="isRequired(required, prop)"
      />
      <div class="mt-4">
        <p
          v-if="computedParam.description"
          class="whitespace-pre-line text-gray-400 text-sm"
        >
          {{ computedParam.description }}
        </p>
        <!-- Handle anyOf -->
        <ApiRequestBodyArrayParam
          v-if="computedParam.anyOf?.length"
          :any-of="computedParam.anyOf"
        />
        <ApiParameterExample :value="computedParam.example" />
      </div>
      <template v-if="computedParam.properties">
        <ApiCollapse class="mt-4">
          <ApiRequestBodyList
            :properties="computedParam.properties"
            :required="computedParam.required"
            :parent-prop="prop"
          />
        </ApiCollapse>
      </template>
    </div>
  </div>
</template>
