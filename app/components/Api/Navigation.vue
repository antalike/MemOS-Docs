<script setup lang="ts">
import type { FlatPathProps } from '@/utils/openapi'

const { paths } = useOpenApi()

const methodColor = {
  post: {
    default: 'bg-blue-400/20 dark:bg-blue-400/20 text-blue-700 dark:text-blue-400',
    active: 'bg-[#3064E3] text-[#FFFFFF]'
  },
  get: {
    default: 'bg-green-400/20 dark:bg-green-400/20 text-green-700 dark:text-green-400',
    active: 'bg-[#2AB673] text-[#FFFFFF]'
  },
  delete: {
    default: 'bg-red-400/20 dark:bg-red-400/20 text-red-700 dark:text-red-400',
    active: 'bg-[#CB3A32] text-[#FFFFFF]'
  },
  put: {
    default: 'bg-yellow-400/20 dark:bg-yellow-400/20 text-yellow-700 dark:text-yellow-400',
    active: 'bg-[#C28C30] text-[#FFFFFF]'
  }
}

type NavLink = {
  title: string
  path?: string
  method?: 'get' | 'post' | 'put' | 'delete'
  children?: NavLink[]
}

const navigationData = computed(() => {
  // Group by first-level segment of apiUrl
  const groupMap = new Map<string, FlatPathProps[]>()

  paths.value.forEach((item: FlatPathProps) => {
    const firstSegment = item.apiUrl.split('/').filter(Boolean)[0] ?? ''
    const groupKey = firstSegment ? `/${firstSegment}` : '/'

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, [])
    }
    groupMap.get(groupKey)!.push(item)
  })

  const items: NavLink[] = []
  const singleItems: NavLink[] = []

  groupMap.forEach((groupItems, groupKey) => {
    if (groupItems.length === 1) {
      const item = groupItems[0]
      singleItems.push({
        title: item.summary,
        path: item.routePath,
        method: item.method
      })
    } else {
      const groupTitle = prettifyGroupTitle(groupKey)
      items.push({
        title: groupTitle,
        children: groupItems
          .map(p => ({
            title: p.summary,
            path: p.routePath,
            method: p.method
          }))
      })
    }
  })

  return [{
    title: 'API Reference',
    children: singleItems.concat(items)
  }]
})

function prettifyGroupTitle(key: string) {
  const base = key.replace(/^\//, '')
  if (!base) return '/'
  return base
    .replace(/[\-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
</script>

<template>
  <UContentNavigation :navigation="navigationData">
    <template #link-leading="{ link, active }">
      <span
        v-if="link.method"
        class="px-1 py-0.5 rounded-md text-[0.55rem] leading-tight font-bold"
        :class="active ? methodColor[link.method].active : methodColor[link.method].default"
      >
        {{ link.method.toUpperCase() }}
      </span>
    </template>
  </UContentNavigation>
</template>
