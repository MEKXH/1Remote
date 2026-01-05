<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { IServerDto } from '../electron-api'
import { useFavorites } from '../composables/useFavorites'

const { t } = useI18n()
const servers = ref<IServerDto[]>([])
const loading = ref(true)
const error = ref('')
const { toggleFavorite, isFavorite } = useFavorites()

const favoriteServers = computed(() => {
  return servers.value.filter(s => isFavorite(s.Id))
})

const fetchServers = async () => {
  loading.value = true
  error.value = ''
  try {
    servers.value = await window.electronAPI.getServers()
  } catch (err: any) {
    console.error('Failed to fetch servers:', err)
    error.value = err.message || t('common.unknown_error')
  } finally {
    loading.value = false
  }
}

const handleConnect = async (serverId: string) => {
  await window.electronAPI.connect(serverId)
}

onMounted(() => {
  fetchServers()
})
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto">
    <div class="flex justify-between items-end mb-8">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight mb-1 text-zinc-900 dark:text-zinc-50">{{
          t('pages.favorites.title') }}</h1>
        <p class="text-zinc-500 dark:text-zinc-400">{{ t('pages.favorites.subtitle') }}</p>
      </div>
      <UButton icon="i-lucide-refresh-cw" variant="outline" :label="t('common.refresh')" color="neutral"
        @click="fetchServers" :loading="loading" />
    </div>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <USkeleton v-for="i in 3" :key="i" class="h-40 w-full" />
    </div>

    <div v-else-if="error" class="p-4 border border-red-200 bg-red-50 text-red-600 rounded-lg">
      <p class="font-bold">{{ t('common.error') }}:</p>
      <p>{{ error }}</p>
    </div>

    <div v-else-if="favoriteServers.length === 0"
      class="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
      <UIcon name="i-lucide-star-off" class="w-12 h-12 text-zinc-300 mb-4" />
      <p class="text-zinc-500">{{ t('pages.favorites.empty') }}</p>
      <UButton :label="t('pages.favorites.go_dashboard')" to="/" variant="link" color="primary" class="mt-2" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard v-for="server in favoriteServers" :key="server.Id"
        class="group hover:ring-2 hover:ring-primary-500 transition-all duration-300 cursor-pointer"
        @click="handleConnect(server.Id)" :ui="{
          root: 'overflow-hidden',
          header: 'border-none p-4 pb-0',
          body: 'p-4',
          footer: 'bg-zinc-50 dark:bg-zinc-900/50 p-3 flex justify-between items-center'
        }">
        <template #header>
          <div class="flex justify-between items-start">
            <div class="p-2 rounded-lg bg-primary-500/10 text-primary-500">
              <UIcon :name="server.Protocol.toLowerCase().includes('ssh') ? 'i-lucide-terminal' : 'i-lucide-monitor'"
                class="w-6 h-6" />
            </div>
            <div class="flex gap-1">
              <UButton icon="i-lucide-star" color="yellow" variant="ghost" size="sm" class="text-yellow-500"
                @click.stop="toggleFavorite(server.Id)" />
              <UButton icon="i-lucide-more-vertical" variant="ghost" color="neutral" size="sm" @click.stop />
            </div>
          </div>
        </template>

        <div class="mt-2">
          <div class="font-bold text-lg leading-tight truncate" :title="server.DisplayName">{{ server.DisplayName }}
          </div>
          <div class="text-sm text-zinc-500 flex items-center gap-1 mt-1 truncate">
            <UIcon name="i-lucide-hash" size="14" />
            {{ server.SubTitle }}
          </div>
        </div>

        <template #footer>
          <div class="flex items-center gap-1">
            <UBadge size="sm" variant="subtle" color="primary">{{ server.Protocol }}</UBadge>
            <UBadge v-for="tag in server.Tags.slice(0, 2)" :key="tag" size="sm" variant="subtle" color="neutral">{{ tag
              }}</UBadge>
          </div>
          <UButton size="xs" :label="t('common.connect')" trailing-icon="i-lucide-chevron-right"
            @click.stop="handleConnect(server.Id)" />
        </template>
      </UCard>
    </div>
  </div>
</template>
