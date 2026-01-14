<template>
  <UDashboardGroup
    :persistent="false"
    unit="px"
  >
    <UDashboardPanel id="main">
      <slot />
    </UDashboardPanel>
    <Assistant />
  </UDashboardGroup>
</template>
