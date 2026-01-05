<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { IServerDto, ISessionDto } from '../electron-api'
import { useFavorites } from '../composables/useFavorites'

const { t } = useI18n()
const servers = ref<IServerDto[]>([])
const activeSessions = ref<ISessionDto[]>([])
const loading = ref(true)
const error = ref('')
const refreshTimer = ref<number | null>(null)
const { isFavorite, toggleFavorite } = useFavorites()

const historyServers = computed(() => {
  return servers.value
    .filter(s => s.LastConnectTime && new Date(s.LastConnectTime).getFullYear() > 2000)
    .sort((a, b) => new Date(b.LastConnectTime).getTime() - new Date(a.LastConnectTime).getTime())
})

const fetchServers = async (options: { withLoading?: boolean; resetError?: boolean } = {}) => {
  const withLoading = options.withLoading !== false
  const resetError = options.resetError !== false
  if (withLoading) {
    loading.value = true
  }
  if (resetError) {
    error.value = ''
  }
  try {
    const [serversData, sessionsData] = await Promise.all([
      window.electronAPI.getServers(),
      window.electronAPI.getActiveSessions()
    ])
    servers.value = serversData
    activeSessions.value = sessionsData
  } catch (err: any) {
    console.error('Failed to fetch servers:', err)
    error.value = err.message || t('common.unknown_error')
  } finally {
    if (withLoading) {
      loading.value = false
    }
  }
}

const handleConnect = async (serverId: string) => {
  await window.electronAPI.connect(serverId)
}

const handleReconnect = async (connectionId: string) => {
  await window.electronAPI.reconnectSession(connectionId)
  await fetchServers()
}

const handleCloseSession = async (connectionId: string) => {
  await window.electronAPI.closeSession(connectionId)
  await fetchServers()
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString()
}

onMounted(() => {
  fetchServers()
  refreshTimer.value = window.setInterval(() => {
    if (loading.value) {
      return
    }
    fetchServers({ withLoading: false, resetError: false })
  }, 2000)
})

onBeforeUnmount(() => {
  if (refreshTimer.value) {
    window.clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
})
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto">
    <div class="flex justify-between items-end mb-8">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight mb-1 text-zinc-900 dark:text-zinc-50">{{ t('pages.history.title') }}</h1>
        <p class="text-zinc-500 dark:text-zinc-400">{{ t('pages.history.subtitle') }}</p>
      </div>
      <UButton icon="i-lucide-refresh-cw" variant="outline" :label="t('common.refresh')" color="neutral" @click="fetchServers" :loading="loading" />
    </div>

    <div v-if="loading" class="space-y-4">
       <USkeleton v-for="i in 3" :key="i" class="h-16 w-full" />
    </div>

    <div v-else-if="error" class="p-4 border border-red-200 bg-red-50 text-red-600 rounded-lg">
      <p class="font-bold">{{ t('common.error') }}:</p>
      <p>{{ error }}</p>
    </div>

    <div v-else-if="historyServers.length === 0" class="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
       <UIcon name="i-lucide-history" class="w-12 h-12 text-zinc-300 mb-4" />
       <p class="text-zinc-500">{{ t('pages.history.empty') }}</p>
    </div>

    <div v-else class="space-y-6">
      <div v-if="activeSessions.length > 0">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            {{ t('pages.history.active_sessions', 'Active sessions') }} ({{ activeSessions.length }})
          </h2>
        </div>
        <div class="space-y-2">
          <UCard
            v-for="session in activeSessions"
            :key="session.ConnectionId"
            class="group hover:ring-2 hover:ring-primary-500 transition-all duration-300"
            :ui="{ body: 'p-3 flex items-center justify-between' }"
          >
            <div class="flex items-center gap-4">
              <div class="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                <UIcon :name="session.Protocol.toLowerCase().includes('ssh') ? 'i-lucide-terminal' : 'i-lucide-monitor'" class="w-5 h-5" />
              </div>
              <div>
                <div class="font-bold text-zinc-900 dark:text-zinc-100">{{ session.DisplayName }}</div>
                <div class="text-xs text-zinc-500 flex items-center gap-2">
                  <span>{{ session.SubTitle }}</span>
                  <span class="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                  <span>{{ session.Status }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <UBadge size="xs" variant="subtle">{{ session.Protocol }}</UBadge>
              <UButton size="xs" variant="outline" color="neutral" :label="t('pages.history.reconnect', 'Reconnect')" @click="handleReconnect(session.ConnectionId)" />
              <UButton size="xs" color="error" variant="outline" :label="t('pages.history.disconnect', 'Disconnect')" @click="handleCloseSession(session.ConnectionId)" />
            </div>
          </UCard>
        </div>
      </div>

      <UCard 
        v-for="server in historyServers" 
        :key="server.Id"
        class="group hover:ring-2 hover:ring-primary-500 transition-all duration-300 cursor-pointer"
        @click="handleConnect(server.Id)"
        :ui="{ body: 'p-3 flex items-center justify-between' }"
      >
        <div class="flex items-center gap-4">
          <div class="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            <UIcon :name="server.Protocol.toLowerCase().includes('ssh') ? 'i-lucide-terminal' : 'i-lucide-monitor'" class="w-5 h-5" />
          </div>
          <div>
            <div class="font-bold text-zinc-900 dark:text-zinc-100">{{ server.DisplayName }}</div>
            <div class="text-xs text-zinc-500 flex items-center gap-2">
              <span>{{ server.SubTitle }}</span>
              <span class="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
              <span>{{ formatDate(server.LastConnectTime) }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <UBadge size="xs" variant="subtle">{{ server.Protocol }}</UBadge>
          <UButton 
            :icon="isFavorite(server.Id) ? 'i-lucide-star' : 'i-lucide-star'" 
            :color="isFavorite(server.Id) ? 'yellow' : 'neutral'" 
            variant="ghost" 
            size="sm" 
            @click.stop="toggleFavorite(server.Id)"
          />
          <UButton icon="i-lucide-chevron-right" variant="ghost" color="neutral" size="sm" />
        </div>
      </UCard>
    </div>
  </div>
</template>
