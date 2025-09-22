<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const props = withDefaults(defineProps<{
  apiData: any
  apiName?: keyof Collections
}>(), {
  apiName: 'openapi'
})

const { schemas } = useOpenApi(props.apiName)

const flattenResponses = computed(() => {
  const responses = props.apiData?.responses || {}
  return Object.entries(responses).map(([statusCode, response]) => {
    const newRes = {
      statusCode,
      description: response.description
    }
    const contentType = Object.keys(response.content || {})[0]

    if (contentType) {
      newRes.contentType = contentType
      const schemaRef = response.content?.[contentType].schema?.$ref
      if (schemaRef) {
        const schemaKey = schemaRef.split('/').pop()
        newRes.data = schemas.value[schemaKey]
      }
    }

    return newRes
  })
})
</script>

<template>
  <div class="flex flex-col box-border w-full relative grow mx-auto max-w-xl 2xl:max-w-2xl xl:w-[calc(100%-28rem)]">
    <header class="relative">
      <h1 class="inline-block text-2xl sm:text-3xl text-gray-900 tracking-tight dark:text-gray-200 font-semibold">
        {{ apiData?.summary }}
      </h1>
      <div class="mt-2 text-lg">
        <p class="text-gray-400">
          {{ apiData?.description }}
        </p>
      </div>
    </header>
    <ApiPath
      :path="apiData?.apiUrl"
      :method="apiData?.method"
    />
    <!-- Mobile/tablet: show the code panel inline above the body -->
    <div class="xl:hidden mt-6">
      <ApiCodePanel
        :responses="flattenResponses"
        :api-name="apiName"
      />
    </div>

    <div class="mdx-content relative mt-8 prose prose-gray dark:prose-invert">
      <ApiParameter
        v-if="apiData?.parameters"
        :data="apiData.parameters"
        :api-name="apiName"
      />
      <ApiRequestBody
        v-if="apiData?.requestBody"
        :data="apiData.requestBody"
        :api-name="apiName"
      />
      <ApiResponse
        v-if="apiData?.responses"
        :data="flattenResponses"
        :api-name="apiName"
      />
      <ApiSurround :api-name="apiName" />
    </div>
  </div>
  <div class="hidden xl:flex self-start sticky xl:flex-col max-w-[28rem] h-[calc(100vh-4rem)] top-[2.5rem]">
    <ApiCodePanel
      :responses="flattenResponses"
      :api-name="apiName"
    />
  </div>
</template>
