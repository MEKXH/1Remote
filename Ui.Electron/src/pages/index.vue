<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { IServerDto } from '../electron-api'

const servers = ref<IServerDto[]>([])
const loading = ref(true)
const error = ref('')

const fetchServers = async () => {
  loading.value = true
  error.value = ''
  try {
    servers.value = await window.electronAPI.getServers()
  } catch (err: any) {
    console.error('Failed to fetch servers:', err)
    error.value = err.message || 'Unknown error occurred'
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
    <!-- Welcome Header -->
    <div class="flex justify-between items-end mb-8">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight mb-1 text-zinc-900 dark:text-zinc-50">Dashboard</h1>
        <p class="text-zinc-500 dark:text-zinc-400">Quickly access your remote sessions and tools.</p>
      </div>
      <div class="flex gap-2">
        <UButton icon="i-lucide-plus" label="New Session" />
        <UButton icon="i-lucide-refresh-cw" variant="outline" label="Refresh" color="neutral" @click="fetchServers" :loading="loading" />
      </div>
    </div>

    <!-- Stats / Quick Info -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
       <UCard v-for="(stat, idx) in ['Active Sessions', 'Total Servers', 'Favorites', 'Recent']" :key="idx" :ui="{ body: 'p-4' }">
          <div class="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-semibold">{{ stat }}</div>
          <div class="text-2xl font-bold"> {{ idx === 1 ? servers.length : [0, 0, 0, 0][idx] }}</div>
       </UCard>
    </div>

    <!-- Server List -->
    <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
      <UIcon name="i-lucide-list" />
      Connections ({{ servers.length }})
    </h2>
    
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
       <USkeleton v-for="i in 6" :key="i" class="h-40 w-full" />
    </div>

    <div v-else-if="error" class="p-4 border border-red-200 bg-red-50 text-red-600 rounded-lg">
      <p class="font-bold">Connection Error:</p>
      <p>{{ error }}</p>
      <p class="text-sm mt-2 text-red-500">Please ensure the 1Remote backend is running.</p>
    </div>

    <div v-else-if="servers.length === 0" class="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
       <UIcon name="i-lucide-monitor-off" class="w-12 h-12 text-zinc-300 mb-4" />
       <p class="text-zinc-500">No servers found. Start the WPF app to populate data.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard 
        v-for="server in servers" 
        :key="server.Id"
        class="group hover:ring-2 hover:ring-primary-500 transition-all duration-300 cursor-pointer"
        @click="handleConnect(server.Id)"
        :ui="{ 
          root: 'overflow-hidden',
          header: 'border-none p-4 pb-0',
          body: 'p-4',
          footer: 'bg-zinc-50 dark:bg-zinc-900/50 p-3 flex justify-between items-center'
        }"
      >
        <template #header>
          <div class="flex justify-between items-start">
            <div class="p-2 rounded-lg bg-primary-500/10 text-primary-500">
              <UIcon :name="server.Protocol.toLowerCase().includes('ssh') ? 'i-lucide-terminal' : 'i-lucide-monitor'" class="w-6 h-6" />
            </div>
            <UButton icon="i-lucide-more-vertical" variant="ghost" color="neutral" size="sm" @click.stop />
          </div>
        </template>

        <div class="mt-2">
          <div class="font-bold text-lg leading-tight truncate" :title="server.DisplayName">{{ server.DisplayName }}</div>
          <div class="text-sm text-zinc-500 flex items-center gap-1 mt-1 truncate">
            <UIcon name="i-lucide-hash" size="14" />
            {{ server.SubTitle }}
          </div>
        </div>

        <template #footer>
          <div class="flex items-center gap-1">
            <UBadge size="sm" variant="subtle" color="primary">{{ server.Protocol }}</UBadge>
            <UBadge v-for="tag in server.Tags.slice(0, 2)" :key="tag" size="sm" variant="subtle" color="neutral">{{ tag }}</UBadge>
          </div>
          <UButton size="xs" label="Connect" trailing-icon="i-lucide-chevron-right" @click.stop="handleConnect(server.Id)" />
        </template>
      </UCard>
    </div>
  </div>
</template>
