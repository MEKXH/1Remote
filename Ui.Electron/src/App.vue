<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useColorMode } from '@vueuse/core'
import { useRoute } from 'vue-router'
import type { NavigationMenuItem } from '@nuxt/ui'
import { useTheme } from './composables/useTheme'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const colorMode = useColorMode()
const { initTheme } = useTheme()

const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set(val: boolean) {
    colorMode.value = val ? 'dark' : 'light'
  }
})

onMounted(() => {
  initTheme()
})

const items = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: t('app.menu.sessions'),
      icon: 'i-lucide-monitor',
      to: '/',
      active: route.path === '/'
    },
    {
      label: t('app.menu.favorites'),
      icon: 'i-lucide-star',
      to: '/favorites',
      active: route.path === '/favorites'
    },
    {
      label: t('app.menu.history'),
      icon: 'i-lucide-history',
      to: '/history',
      active: route.path === '/history'
    },
    {
      label: t('app.menu.network'),
      icon: 'i-lucide-network',
      to: '/network',
      active: route.path === '/network'
    }
  ],
  [
    {
      label: t('app.menu.settings'),
      icon: 'i-lucide-settings',
      to: '/settings',
      active: route.path === '/settings'
    }
  ]
])

const collapsed = ref(false)

const pageTitle = computed(() => {
  const allItems = items.value.flat()
  const activeItem = allItems.find(i => i.active)
  return activeItem?.label || t('app.title')
})

const handleMinimize = () => {
  console.log('Minimize clicked')
  if (window.electronAPI?.minimize) {
    window.electronAPI.minimize()
  } else {
    console.error('electronAPI.minimize is missing')
  }
}

const handleMaximize = () => {
  console.log('Maximize clicked')
  if (window.electronAPI?.maximize) {
    window.electronAPI.maximize()
  } else {
    console.error('electronAPI.maximize is missing')
  }
}

const handleClose = () => {
  console.log('Close clicked')
  if (window.electronAPI?.close) {
    window.electronAPI.close()
  } else {
    console.error('electronAPI.close is missing')
  }
}
</script>

<template>
  <UApp>
    <UDashboardGroup>
      <!-- Main Sidebar -->
      <UDashboardSidebar v-model:collapsed="collapsed" collapsible
        class="bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-[width] duration-200 ease-out"
        :style="{ width: collapsed ? '64px' : '200px' }">
        <template #header="{ collapsed: sidebarCollapsed }">
          <!-- Header Container: Flex layout with smooth transitions -->
          <div class="flex items-center h-14 w-full px-2 transition-all duration-200 ease-out"
            :class="sidebarCollapsed ? 'justify-center' : 'justify-start gap-3'">
            <!-- Logo -->
            <div class="p-1.5 rounded-lg bg-primary-500 text-white flex items-center justify-center w-8 h-8 shrink-0">
              <UIcon name="i-lucide-layers" class="w-5 h-5" />
            </div>

            <!-- Title: Smooth fade transition -->
            <span
              class="font-bold tracking-tight text-lg whitespace-nowrap transition-all duration-200 ease-out origin-left"
              :class="sidebarCollapsed ? 'opacity-0 scale-95 w-0 overflow-hidden' : 'opacity-100 scale-100'">
              {{ t('app.title') }}
            </span>
          </div>
        </template>

        <template #default="{ collapsed: sidebarCollapsed }">
          <div class="flex flex-col gap-2 flex-1 h-full">
            <UNavigationMenu :items="items[0]" orientation="vertical" :collapsed="sidebarCollapsed" :ui="{
              root: 'gap-2',
              link: 'py-2.5 text-sm before:rounded-sm',
              linkLeadingIcon: 'size-5'
            }" />

            <div class="mt-auto flex flex-col gap-2">
              <!-- Sidebar Toggle Button (Using Official Component) -->
              <UDashboardSidebarCollapse variant="ghost" color="neutral"
                class="transition-all duration-200 ease-out mx-4 collapse-btn"
                :class="sidebarCollapsed ? 'w-10 h-10 p-0 justify-center mx-auto' : 'py-2.5 justify-start'" />

              <div class="h-px bg-zinc-200 dark:bg-zinc-800 mx-2 my-1"></div>

              <UNavigationMenu :items="items[1]" orientation="vertical" :collapsed="sidebarCollapsed" :ui="{
                root: 'gap-2',
                link: 'py-2.5 text-sm before:rounded-sm',
                linkLeadingIcon: 'size-5'
              }" />
            </div>
          </div>
        </template>

        <template #footer>
          <!-- Footer is now empty or can be used for user profile/info later -->
        </template>
      </UDashboardSidebar>

      <!-- Main Content Panel -->
      <UDashboardPanel>
        <template #header>
          <div
            class="h-12 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 select-none shrink-0"
            style="-webkit-app-region: drag">
            <!-- Left: Title -->
            <div class="flex items-center gap-2">
              <span class="font-semibold text-zinc-900 dark:text-zinc-100">
                {{ pageTitle }}
              </span>
            </div>

            <!-- Right: Tools and Window Controls -->
            <div class="flex items-center gap-1 h-full" style="-webkit-app-region: no-drag">
              <!-- Theme Toggle -->
              <UButton :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'" variant="ghost" color="neutral" size="sm"
                class="rounded-lg h-8 w-8 flex items-center justify-center" @click="isDark = !isDark" />

              <div class="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1"></div>

              <span
                class="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium whitespace-nowrap">v1.3.0</span>

              <div class="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1"></div>

              <!-- Window Controls (Electron Custom) -->
              <div class="flex items-center -mr-4 h-full">
                <UButton icon="i-lucide-minus" variant="ghost" color="neutral" size="sm"
                  class="rounded-none h-full w-12 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"
                  @click="handleMinimize" />
                <UButton icon="i-lucide-square" variant="ghost" color="neutral" size="sm"
                  class="rounded-none h-full w-12 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"
                  @click="handleMaximize" />
                <UButton icon="i-lucide-x" variant="ghost" color="neutral" size="sm"
                  class="rounded-none h-full w-12 hover:bg-red-500 hover:text-white flex items-center justify-center"
                  @click="handleClose" />
              </div>
            </div>
          </div>
        </template>

        <template #body>
          <RouterView v-slot="{ Component }">
            <Transition name="fade" mode="out-in">
              <KeepAlive>
                <component :is="Component" />
              </KeepAlive>
            </Transition>
          </RouterView>
        </template>
      </UDashboardPanel>
    </UDashboardGroup>
  </UApp>
</template>

<style>
/* Page Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Smooth Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #d4d4d8;
  border-radius: 10px;
}

.dark ::-webkit-scrollbar-thumb {
  background: #27272a;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1aa;
}

/* Ensure UDashboardGroup takes full height */
.u-dashboard-group {
  height: 100vh !important;
}

/* Make collapsed navigation menu items square - match expanded height (py-2.5 + icon = ~40px) */
[data-collapsed="true"] a,
[data-collapsed="true"] button {
  width: 40px !important;
  height: 40px !important;
  padding: 0 !important;
  justify-content: center !important;
  margin: 0 auto !important;
}

[data-collapsed="true"] a::before,
[data-collapsed="true"] button::before {
  inset: 0 !important;
  border-radius: 0.375rem !important;
}
</style>
