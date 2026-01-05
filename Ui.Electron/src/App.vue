<script setup lang="ts">
import { computed } from 'vue'
import { useColorMode } from '@vueuse/core'
import { useRoute } from 'vue-router'

const route = useRoute()
const colorMode = useColorMode()
const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set(val: boolean) {
    colorMode.value = val ? 'dark' : 'light'
  }
})

const items = [
  {
    label: 'Sessions',
    icon: 'i-lucide-monitor',
    to: '/'
  },
  {
    label: 'Favorites',
    icon: 'i-lucide-star',
    to: '/favorites'
  },
  {
    label: 'History',
    icon: 'i-lucide-history',
    to: '/history'
  },
  {
    label: 'Network',
    icon: 'i-lucide-network',
    to: '/network'
  }
]

const bottomItems = [
  {
    label: 'Settings',
    icon: 'i-lucide-settings',
    to: '/settings'
  }
]

const isActive = (path: string) => route.path === path
</script>

<template>
  <UApp>
    <div class="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100">
      
      <!-- Left Sidebar -->
      <aside class="w-[64px] flex flex-col items-center py-4 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
        <!-- Brand Logo -->
        <div class="mb-8 p-1 rounded-xl bg-primary-500/10 dark:bg-primary-500/20">
          <UIcon name="i-lucide-layers" class="w-8 h-8 text-primary-500" />
        </div>

        <!-- Main Nav Icons -->
        <nav class="flex-1 flex flex-col gap-4 w-full px-2">
          <UTooltip v-for="item in items" :key="item.label" :text="item.label" side="right">
            <UButton
              :to="item.to"
              :icon="item.icon"
              variant="ghost"
              :color="isActive(item.to) ? 'primary' : 'neutral'"
              size="xl"
              class="w-full justify-center transition-all duration-200"
              :class="isActive(item.to) ? 'bg-primary-500/10 dark:bg-primary-500/20' : ''"
            />
          </UTooltip>
        </nav>

        <!-- Bottom Icons -->
        <div class="flex flex-col gap-4 w-full px-2">
          <UTooltip text="Toggle Theme" side="right">
            <UButton
              :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
              variant="ghost"
              color="neutral"
              size="xl"
              class="w-full justify-center"
              @click="isDark = !isDark"
            />
          </UTooltip>
          <UTooltip v-for="item in bottomItems" :key="item.label" :text="item.label" side="right">
            <UButton
              :to="item.to"
              :icon="item.icon"
              variant="ghost"
              :color="isActive(item.to) ? 'primary' : 'neutral'"
              size="xl"
              class="w-full justify-center transition-all duration-200"
              :class="isActive(item.to) ? 'bg-primary-500/10 dark:bg-primary-500/20' : ''"
            />
          </UTooltip>
        </div>
      </aside>

      <!-- Right Panel -->
      <main class="flex-1 flex flex-col min-w-0">
        
        <!-- Header / TitleBar -->
        <header class="h-12 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md select-none" style="-webkit-app-region: drag">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold tracking-tight text-primary-500">1Remote</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">v1.3.0</span>
          </div>
          
          <!-- Modern Search Bar -->
          <div class="flex-1 max-w-md mx-8" style="-webkit-app-region: no-drag">
            <UInput
              icon="i-lucide-search"
              variant="soft"
              color="neutral"
              size="sm"
              placeholder="Search everything... (Ctrl + K)"
              class="w-full"
              :ui="{ 
                root: 'rounded-full',
                base: 'bg-zinc-100 dark:bg-zinc-800 focus:ring-1 focus:ring-primary-500'
              }"
            >
              <template #trailing>
                <div class="flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[10px] text-zinc-400">
                  <span class="text-xs">⌘</span>K
                </div>
              </template>
            </UInput>
          </div>

          <!-- Window Control Buttons (Electron) -->
          <div class="flex items-center" style="-webkit-app-region: no-drag">
            <UButton icon="i-lucide-minus" variant="ghost" color="neutral" size="sm" class="rounded-none hover:bg-zinc-100 dark:hover:bg-zinc-800" />
            <UButton icon="i-lucide-square" variant="ghost" color="neutral" size="sm" class="rounded-none hover:bg-zinc-100 dark:hover:bg-zinc-800" />
            <UButton icon="i-lucide-x" variant="ghost" color="neutral" size="sm" class="rounded-none hover:bg-red-500 hover:text-white" />
          </div>
        </header>

        <!-- Main Content Scroll Area -->
        <div class="flex-1 overflow-auto bg-zinc-50/30 dark:bg-zinc-950/30">
           <RouterView />
        </div>

      </main>
    </div>
  </UApp>
</template>

<style>
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
</style>
