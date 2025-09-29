<script setup lang="ts">
import type { JSONValue } from '@/utils/jsonHighlight'
import { renderHighlightedJson } from '@/utils/jsonHighlight'

type JSONValueLocal = JSONValue

interface SchemaLike {
  type?: string
  title?: string
  properties?: Record<string, SchemaLike>
  items?: SchemaLike
  example?: JSONValueLocal
  default?: JSONValueLocal
  enum?: JSONValueLocal[]
  anyOf?: SchemaLike[]
  oneOf?: SchemaLike[]
  allOf?: SchemaLike[]
}

interface ResponseItem {
  statusCode: string
  description?: string
  contentType?: string
  data?: SchemaLike
}
const props = defineProps<{
  responses: ResponseItem[]
}>()

const active = ref<number>(0)

function pickSchema(s: SchemaLike | undefined): SchemaLike | undefined {
  if (!s) return s
  if (s.anyOf && s.anyOf.length) return pickSchema(s.anyOf[0])
  if (s.oneOf && s.oneOf.length) return pickSchema(s.oneOf[0])
  if (s.allOf && s.allOf.length) {
    return s.allOf.reduce((acc: SchemaLike, cur: SchemaLike) => ({ ...acc, ...pickSchema(cur) }), {} as SchemaLike)
  }
  return s
}

function jsonFromSchema(schema: SchemaLike | undefined, seen = new Set<SchemaLike>()): JSONValueLocal {
  const s = pickSchema(schema) || {}

  if (s.example !== undefined) return s.example
  if (s.default !== undefined) return s.default

  if (seen.has(s as SchemaLike)) return null
  seen.add(s as SchemaLike)

  const t = s.type
  if (t === 'object' || (s.properties && !t)) {
    const obj: Record<string, JSONValueLocal> = {}
    const props = s.properties || {}
    for (const key of Object.keys(props)) {
      obj[key] = jsonFromSchema(props[key], seen)
    }
    return obj
  }
  if (t === 'array') {
    const itemSchema = pickSchema(s.items) || { type: 'any' }
    return [jsonFromSchema(itemSchema, seen)]
  }
  if (t === 'integer' || t === 'number') return '<number>'
  if (t === 'boolean') return '<boolean>'
  if (t === 'null') return null
  if (t === 'string') return '<string>'
  if (s.enum && s.enum.length) return s.enum[0]
  // default to string
  return typeof s.title === 'string' ? s.title : '<any>'
}

const exampleObjects = computed<JSONValueLocal[]>(() => props.responses.map(r => jsonFromSchema(r?.data)))
const highlightedExamples = computed<string[]>(() => exampleObjects.value.map(obj => renderHighlightedJson(obj, 0)))
const plainJsonStrings = computed<string[]>(() => exampleObjects.value.map(obj => JSON.stringify(obj, null, 2)))

function handleClick(index: number) {
  active.value = index
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(plainJsonStrings.value[active.value] || '')
  } catch {
    // ignore
  }
}
</script>

<template>
  <div class="w-full xl:w-[28rem] gap-6 grid grid-rows-[repeat(auto-fit,minmax(0,min-content))] grid-rows relative max-h-[calc(100%-32px)] min-h-[18rem]">
    <div class="p-0.5 flex flex-col relative overflow-hidden rounded-2xl border border-gray-950/10 dark:border-white/10 my-0 dark:text-gray-50">
      <div class="flex items-center justify-between gap-2 relative px-2.5">
        <div class="flex-1 min-w-0 text-xs leading-6 rounded-tl-xl gap-1 flex overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-black/15 hover:scrollbar-thumb-black/20 active:scrollbar-thumb-black/20 dark:scrollbar-thumb-white/20 dark:hover:scrollbar-thumb-white/25 dark:active:scrollbar-thumb-white/25">
          <button
            v-for="(res, index) in responses"
            :key="res.statusCode"
            class="group flex items-center relative gap-1.5 py-1 pb-1.5 outline-none whitespace-nowrap font-medium text-gray-500 cursor-pointer dark:text-gray-400"
            :class="active === index ? 'text-primary dark:text-primary-400' : ''"
            @click="handleClick(index)"
          >
            <div class="flex items-center gap-1.5 px-1.5 rounded-lg z-10 group-hover:bg-gray-200/50 dark:group-hover:bg-gray-700/70 group-hover:text-primary dark:group-hover:text-primary-light">
              {{ res.statusCode }}
            </div>
            <div
              v-show="active === index"
              class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary dark:bg-primary-light"
            />
          </button>
        </div>
        <button
          class="cursor-pointer"
          @click="handleCopy"
        >
          <UIcon
            name="i-lucide-copy"
            class="text-gray-400"
          />
        </button>
      </div>
      <div class="flex flex-1 overflow-hidden">
        <div class="w-full min-w-full max-w-full h-full max-h-full">
          <div class="w-0 min-w-full max-w-full py-3.5 px-4 h-full bg-[#0b0c0e] relative text-sm leading-6 children:!my-0 children:!shadow-none children:!bg-transparent transition-[height] duration-300 ease-in-out [&_*]:ring-0 [&_*]:outline-none [&_*]:focus:ring-0 [&_*]:focus:outline-none [&_pre>code]:pr-[3rem] [&_pre>code>span.line-highlight]:min-w-[calc(100%+3rem)] [&_pre>code>span.line-diff]:min-w-[calc(100%+3rem)] rounded-[14px] verflow-auto overflow-x-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-black/15 hover:scrollbar-thumb-black/20 active:scrollbar-thumb-black/20 dark:scrollbar-thumb-white/20 dark:hover:scrollbar-thumb-white/25 dark:active:scrollbar-thumb-white/25">
            <div class="font-mono whitespace-pre flex-none h-full text-xs leading-[1.35rem]">
              <pre><code v-html="highlightedExamples[active]" /></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
