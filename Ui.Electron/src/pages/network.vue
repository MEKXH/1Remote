<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { INetworkInterfaceInfo } from '../electron-api'

const { t } = useI18n()
const interfaces = ref<Record<string, INetworkInterfaceInfo[]>>({})
const loading = ref(true)

const fetchInterfaces = async () => {
  loading.value = true
  try {
    interfaces.value = await window.electronAPI.getNetworkInterfaces()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchInterfaces()
})
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto">
    <div class="flex justify-between items-end mb-8">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight mb-1 text-zinc-900 dark:text-zinc-50">{{ t('pages.network.title') }}</h1>
        <p class="text-zinc-500 dark:text-zinc-400">{{ t('pages.network.subtitle') }}</p>
      </div>
      <UButton icon="i-lucide-refresh-cw" variant="outline" :label="t('common.refresh')" color="neutral" @click="fetchInterfaces" :loading="loading" />
    </div>

    <div v-if="loading" class="space-y-4">
       <USkeleton v-for="i in 3" :key="i" class="h-24 w-full" />
    </div>

    <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <UCard 
        v-for="(ifaceList, name) in interfaces" 
        :key="name"
        :ui="{ header: 'p-4 border-b border-zinc-100 dark:border-zinc-800' }"
      >
        <template #header>
          <div class="flex items-center gap-3">
             <div class="p-2 rounded-lg bg-primary-500/10 text-primary-500">
               <UIcon name="i-lucide-network" class="w-5 h-5" />
             </div>
             <div>
               <h3 class="font-bold text-lg">{{ name }}</h3>
               <div class="text-xs text-zinc-500">{{ ifaceList.length }} {{ t('pages.network.addresses') }}</div>
             </div>
          </div>
        </template>
        
        <div class="divide-y divide-zinc-100 dark:divide-zinc-800">
          <div v-for="(addr, idx) in ifaceList" :key="idx" class="py-3 first:pt-0 last:pb-0">
            <div class="flex items-center justify-between mb-1">
              <UBadge :color="addr.family === 'IPv4' ? 'primary' : 'neutral'" variant="subtle" size="xs">{{ addr.family }}</UBadge>
              <div class="text-xs font-mono text-zinc-400">{{ addr.mac }}</div>
            </div>
            <div class="font-mono text-sm font-semibold mb-1">{{ addr.address }}</div>
            <div class="flex gap-4 text-xs text-zinc-500">
              <div v-if="addr.netmask">{{ t('pages.network.mask') }}: {{ addr.netmask }}</div>
              <div v-if="addr.cidr">{{ t('pages.network.cidr') }}: {{ addr.cidr }}</div>
              <div v-if="addr.internal" class="text-orange-500 font-medium">{{ t('pages.network.internal') }}</div>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
