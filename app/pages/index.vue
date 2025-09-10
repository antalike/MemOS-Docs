<script setup lang="ts">
import pageYml from './.index.yml'
</script>

<template>
  <UPage>
    <UPageHero class="overflow-hidden px-0 max-w-[100vw]">
      <template #top>
        <div
          class="absolute z-[10] rounded-full bg-primary blur-[300px] size-60 sm:size-80 transform -translate-x-1/2 left-1/2 -translate-y-80"
        />
      </template>

      <template #title>
        {{ pageYml.hero.title }}
      </template>
      <template #description>
        <div>
          <div
            :class="[
              'transition-all duration-1200 ease-out opacity-100 translate-y-0',
            ]"
          >
            {{ pageYml.hero.description }}
          </div>
        </div>
      </template>

      <template #links>
        <template v-for="link of pageYml.hero.links" :key="link.label">
          <UButton
            target="_blank"
            v-bind="link"
            size="xl"
            :icon="link.icon"
            :class="link.class"
          />
        </template>
      </template>
      <StarsBg />
    </UPageHero>
  </UPage>
</template>
