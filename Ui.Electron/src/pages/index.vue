<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { IServerDto, IDataSourceStatus } from '../electron-api'
import { useFavorites } from '../composables/useFavorites'
import AddServerModal from '../components/AddServerModal.vue'
import type { ContextMenuItem } from '@nuxt/ui'

const { t } = useI18n()
const servers = ref<IServerDto[]>([])
const allTags = ref<string[]>([])
const selectedTags = ref<string[]>([])
const dataSourceStatus = ref<IDataSourceStatus | null>(null)
const selectedIds = ref<Set<string>>(new Set())
const stats = ref({
  ActiveSessions: 0,
  TotalServers: 0,
  Favorites: 0,
  Recent: 0
})
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const showAddModal = ref(false)
const editingId = ref<string | null>(null)
const { favorites, toggleFavorite, isFavorite } = useFavorites()

// Layout and sorting options
const viewMode = ref<'grid' | 'list'>('grid')
const sortBy = ref<'name' | 'protocol' | 'recent'>('name')
const sortOrder = ref<'asc' | 'desc'>('asc')

const filteredServers = computed(() => {
  let result = servers.value

  // Filter by tags
  if (selectedTags.value.length > 0) {
    result = result.filter(s => 
      selectedTags.value.every(tag => s.Tags.includes(tag))
    )
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(s =>
      s.DisplayName.toLowerCase().includes(query) ||
      s.SubTitle.toLowerCase().includes(query) ||
      s.Protocol.toLowerCase().includes(query) ||
      s.Tags.some(t => t.toLowerCase().includes(query))
    )
  }

  // Sort
  result = [...result].sort((a, b) => {
    let comparison = 0

    if (sortBy.value === 'name') {
      comparison = a.DisplayName.localeCompare(b.DisplayName)
    } else if (sortBy.value === 'protocol') {
      comparison = a.Protocol.localeCompare(b.Protocol)
    } else if (sortBy.value === 'recent') {
      const aTime = a.LastConnectTime ? new Date(a.LastConnectTime).getTime() : 0
      const bTime = b.LastConnectTime ? new Date(b.LastConnectTime).getTime() : 0
      comparison = bTime - aTime
    }

    return sortOrder.value === 'asc' ? comparison : -comparison
  })

  return result
})

const hasSelection = computed(() => selectedIds.value.size > 0)
const selectedCount = computed(() => selectedIds.value.size)
const filteredIds = computed(() => filteredServers.value.map(server => server.Id))
const isAllSelected = computed(() => {
  const ids = filteredIds.value
  if (ids.length === 0) {
    return false
  }
  return ids.every(id => selectedIds.value.has(id))
})
const selectedServers = computed(() =>
  servers.value.filter(server => selectedIds.value.has(server.Id))
)

const setSelectedIds = (next: Set<string>) => {
  selectedIds.value = next
}

const toggleSelect = (serverId: string) => {
  const next = new Set(selectedIds.value)
  if (next.has(serverId)) {
    next.delete(serverId)
  } else {
    next.add(serverId)
  }
  setSelectedIds(next)
}

const clearSelection = () => {
  setSelectedIds(new Set())
}

const selectAllFiltered = () => {
  setSelectedIds(new Set(filteredIds.value))
}

const syncSelection = () => {
  if (selectedIds.value.size === 0) {
    return
  }
  const currentIds = new Set(servers.value.map(server => server.Id))
  const next = new Set<string>()
  selectedIds.value.forEach(id => {
    if (currentIds.has(id)) {
      next.add(id)
    }
  })
  setSelectedIds(next)
}

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
    const [serversData, statsData, tagsData, statusData] = await Promise.all([
      window.electronAPI.getServers(),
      window.electronAPI.getDashboardStats(),
      window.electronAPI.getTags(),
      window.electronAPI.getLocalDataSourceStatus()
    ])
    servers.value = serversData
    syncSelection()
    if (statsData) {
      stats.value = statsData
    }
    if (tagsData) {
      allTags.value = tagsData
    }
    dataSourceStatus.value = statusData
  } catch (err: any) {
    console.error('Failed to fetch servers:', err)
    error.value = err.message || t('common.unknown_error')
  } finally {
    if (withLoading) {
      loading.value = false
    }
  }
}

const refreshServers = async () => {
  loading.value = true
  error.value = ''
  try {
    const result = await window.electronAPI.reloadServers()
    if (result && !result.IsSuccess) {
      error.value = result.ErrorInfo || t('common.unknown_error')
    }
  } catch (err: any) {
    console.error('Failed to reload servers:', err)
    error.value = err.message || t('common.unknown_error')
  } finally {
    await fetchServers({ withLoading: false, resetError: false })
    loading.value = false
  }
}

const handleConnect = async (serverId: string) => {
  await window.electronAPI.connect(serverId)
}

const handleConnectSelected = async () => {
  const targets = selectedServers.value.map(server => server.Id)
  if (targets.length === 0) {
    return
  }
  await Promise.all(targets.map(id => window.electronAPI.connect(id)))
}

const handleDeleteSelected = async () => {
  const targets = selectedServers.value
  if (targets.length === 0) {
    return
  }
  const confirmed = confirm(
    t('pages.dashboard.delete_confirm_multi', 'Delete {count} servers?', { count: targets.length })
  )
  if (!confirmed) {
    return
  }
  loading.value = true
  try {
    for (const server of targets) {
      const result = await window.electronAPI.deleteServer(server.Id)
      if (!result.IsSuccess) {
        alert(result.ErrorInfo || t('common.unknown_error'))
        break
      }
    }
  } catch (err: any) {
    console.error('Failed to delete servers:', err)
    alert(err.message || t('common.unknown_error'))
  } finally {
    clearSelection()
    await fetchServers({ withLoading: false, resetError: false })
    loading.value = false
  }
}

const handleEdit = (serverId: string) => {
  editingId.value = serverId
  showAddModal.value = true
}

const handleDelete = async (server: IServerDto) => {
  if (confirm(t('pages.dashboard.delete_confirm', { name: server.DisplayName }))) {
    loading.value = true
    try {
      const result = await window.electronAPI.deleteServer(server.Id)
      if (result.IsSuccess) {
        await fetchServers()
      } else {
        alert(result.ErrorInfo || t('common.unknown_error'))
      }
    } catch (err: any) {
      console.error('Failed to delete server:', err)
      alert(err.message || t('common.unknown_error'))
    } finally {
      loading.value = false
    }
  }
}

const handleDuplicate = async (server: IServerDto) => {
  loading.value = true
  try {
    const result = await window.electronAPI.duplicateServer(server.Id)
    if (result.IsSuccess) {
      await fetchServers()
    } else {
      alert(result.ErrorInfo || t('common.unknown_error'))
    }
  } catch (err: any) {
    console.error('Failed to duplicate server:', err)
    alert(err.message || t('common.unknown_error'))
  } finally {
    loading.value = false
  }
}

// Context menu for each server card
const getContextMenuItems = (server: IServerDto): ContextMenuItem[][] => {
  return [
    [
      {
        label: t('pages.dashboard.context_menu.connect'),
        icon: 'i-lucide-play',
        onSelect: () => handleConnect(server.Id)
      },
      {
        label: isFavorite(server.Id)
          ? t('pages.dashboard.context_menu.remove_favorite')
          : t('pages.dashboard.context_menu.add_favorite'),
        icon: isFavorite(server.Id) ? 'i-lucide-star-off' : 'i-lucide-star',
        onSelect: () => toggleFavorite(server.Id)
      }
    ],
    [
      {
        label: t('pages.dashboard.context_menu.edit'),
        icon: 'i-lucide-pencil',
        onSelect: () => handleEdit(server.Id)
      },
      {
        label: t('pages.dashboard.context_menu.duplicate'),
        icon: 'i-lucide-copy',
        onSelect: () => handleDuplicate(server)
      }
    ],
    [
      {
        label: t('pages.dashboard.context_menu.delete'),
        icon: 'i-lucide-trash-2',
        color: 'error',
        onSelect: () => handleDelete(server)
      }
    ]
  ]
}

onMounted(() => {
  fetchServers()
})
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto w-full" :class="{ 'pb-28': hasSelection }">
    <!-- Welcome Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight mb-1 text-zinc-900 dark:text-zinc-50">{{ t('pages.dashboard.title') }}</h1>
        <p class="text-zinc-500 dark:text-zinc-400">{{ t('pages.dashboard.subtitle') }}</p>
      </div>
      <div class="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
        <UInput 
          v-model="searchQuery" 
          icon="i-lucide-search" 
          :placeholder="t('pages.dashboard.search_placeholder')" 
          class="w-full md:w-64"
          :ui="{ icon: { trailing: { pointer: '' } } }"
        >
          <template #trailing v-if="searchQuery">
            <UButton
              color="neutral"
              variant="link"
              icon="i-lucide-x"
              :padded="false"
              @click="searchQuery = ''"
            />
          </template>
        </UInput>
        <UButton icon="i-lucide-plus" :label="t('pages.dashboard.new_session')" @click="showAddModal = true" />
        <UButton icon="i-lucide-refresh-cw" variant="outline" :label="t('common.refresh')" color="neutral" @click="refreshServers" :loading="loading" />
      </div>
    </div>

    <!-- Stats / Quick Info -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
       <UCard v-for="(statKey, idx) in ['active_sessions', 'total_servers', 'favorites', 'recent']" :key="idx" :ui="{ body: 'p-4' }">
          <div class="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-semibold">{{ t(`pages.dashboard.stats.${statKey}`) }}</div>
          <div class="text-2xl font-bold">
            <template v-if="idx === 0">{{ stats.ActiveSessions }}</template>
            <template v-else-if="idx === 1">{{ servers.length }}</template>
            <template v-else-if="idx === 2">{{ favorites.length }}</template>
            <template v-else-if="idx === 3">{{ stats.Recent }}</template>
          </div>
       </UCard>
    </div>

    <!-- Tags Filter -->
    <div v-if="allTags.length > 0" class="flex flex-wrap gap-2 mb-6">
      <UButton
        v-for="tag in allTags"
        :key="tag"
        size="xs"
        :variant="selectedTags.includes(tag) ? 'solid' : 'outline'"
        :color="selectedTags.includes(tag) ? 'primary' : 'neutral'"
        @click="selectedTags.includes(tag) ? selectedTags = selectedTags.filter(t => t !== tag) : selectedTags.push(tag)"
        class="rounded-full"
      >
        #{{ tag }}
      </UButton>
      <UButton
        v-if="selectedTags.length > 0"
        size="xs"
        variant="link"
        color="error"
        icon="i-lucide-trash-2"
        @click="selectedTags = []"
      >
        {{ t('pages.dashboard.clear_filters') }}
      </UButton>
    </div>

    <!-- Server List Header -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold flex items-center gap-2">
        <UIcon name="i-lucide-list" />
        {{ t('pages.dashboard.connections') }} ({{ filteredServers.length }}<span v-if="filteredServers.length !== servers.length" class="text-zinc-400 font-normal">/ {{ servers.length }}</span>)
      </h2>

    <div class="flex items-center gap-2">
        <!-- Sort options -->
        <UDropdownMenu>
          <UButton
            icon="i-lucide-arrow-up-down"
            variant="outline"
            color="neutral"
            size="sm"
            :label="t('pages.dashboard.sort.label')"
          />

          <template #content>
            <div class="p-2">
              <div class="text-xs font-semibold text-zinc-500 mb-2 px-2">{{ t('pages.dashboard.sort.by') }}</div>
              <UButton
                :variant="sortBy === 'name' ? 'soft' : 'ghost'"
                color="neutral"
                size="sm"
                icon="i-lucide-text"
                :label="t('pages.dashboard.sort.name')"
                class="w-full justify-start mb-1"
                @click="sortBy = 'name'"
              />
              <UButton
                :variant="sortBy === 'protocol' ? 'soft' : 'ghost'"
                color="neutral"
                size="sm"
                icon="i-lucide-layers"
                :label="t('pages.dashboard.sort.protocol')"
                class="w-full justify-start mb-1"
                @click="sortBy = 'protocol'"
              />
              <UButton
                :variant="sortBy === 'recent' ? 'soft' : 'ghost'"
                color="neutral"
                size="sm"
                icon="i-lucide-clock"
                :label="t('pages.dashboard.sort.recent')"
                class="w-full justify-start mb-3"
                @click="sortBy = 'recent'"
              />

              <USeparator class="my-2" />

              <div class="text-xs font-semibold text-zinc-500 mb-2 px-2">{{ t('pages.dashboard.sort.order') }}</div>
              <UButton
                :variant="sortOrder === 'asc' ? 'soft' : 'ghost'"
                color="neutral"
                size="sm"
                icon="i-lucide-arrow-up-a-z"
                :label="t('pages.dashboard.sort.ascending')"
                class="w-full justify-start mb-1"
                @click="sortOrder = 'asc'"
              />
              <UButton
                :variant="sortOrder === 'desc' ? 'soft' : 'ghost'"
                color="neutral"
                size="sm"
                icon="i-lucide-arrow-down-z-a"
                :label="t('pages.dashboard.sort.descending')"
                class="w-full justify-start"
                @click="sortOrder = 'desc'"
              />
            </div>
          </template>
        </UDropdownMenu>

        <!-- View mode toggle -->
        <UFieldGroup orientation="horizontal">
          <UButton
            :icon="viewMode === 'grid' ? 'i-lucide-grid-3x3' : 'i-lucide-grid-3x3'"
            :variant="viewMode === 'grid' ? 'solid' : 'outline'"
            :color="viewMode === 'grid' ? 'primary' : 'neutral'"
            size="sm"
            @click="viewMode = 'grid'"
          />
          <UButton
            :icon="viewMode === 'list' ? 'i-lucide-list' : 'i-lucide-list'"
            :variant="viewMode === 'list' ? 'solid' : 'outline'"
            :color="viewMode === 'list' ? 'primary' : 'neutral'"
            size="sm"
            @click="viewMode = 'list'"
          />
        </UFieldGroup>
        <UButton
          v-if="hasSelection"
          size="sm"
          variant="outline"
          color="neutral"
          :label="t('pages.dashboard.clear_selection', 'Clear')"
          @click="clearSelection"
        />
      </div>
    </div>
    
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
       <USkeleton v-for="i in 6" :key="i" class="h-40 w-full" />
    </div>

    <div v-else-if="error" class="p-4 border border-red-200 bg-red-50 text-red-600 rounded-lg">
      <p class="font-bold">{{ t('pages.dashboard.connection_error') }}</p>
      <p>{{ error }}</p>
      <p class="text-sm mt-2 text-red-500">{{ t('pages.dashboard.backend_error') }}</p>
    </div>

    <div v-else-if="filteredServers.length === 0" class="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
       <UIcon v-if="searchQuery" name="i-lucide-search-x" class="w-12 h-12 text-zinc-300 mb-4" />
       <UIcon v-else name="i-lucide-monitor-off" class="w-12 h-12 text-zinc-300 mb-4" />
       <p class="text-zinc-500">{{ searchQuery ? t('pages.dashboard.empty_search') : t('pages.dashboard.empty_server') }}</p>
       <UButton v-if="searchQuery" :label="t('pages.dashboard.clear_search')" variant="link" color="primary" @click="searchQuery = ''" class="mt-2" />
    </div>

    <div
      v-if="!loading && !error && dataSourceStatus && dataSourceStatus.Status !== 'OK'"
      class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900"
    >
      <div class="font-semibold">
        {{ t('pages.dashboard.datasource_error', 'Data source is not ready') }}
      </div>
      <div class="text-sm mt-1">
        {{ dataSourceStatus.StatusInfo || dataSourceStatus.Status }}
      </div>
      <div v-if="dataSourceStatus.Path" class="text-xs mt-2 text-amber-700 break-all">
        {{ dataSourceStatus.Path }}
      </div>
      <div class="mt-3">
        <UButton size="xs" color="neutral" variant="outline" :label="t('common.refresh')" @click="refreshServers" />
      </div>
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UContextMenu v-for="server in filteredServers" :key="server.Id" :items="getContextMenuItems(server)">
        <UCard
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
              <div class="flex items-center gap-1">
                <UButton
                  :icon="isFavorite(server.Id) ? 'i-lucide-star' : 'i-lucide-star'"
                  :color="isFavorite(server.Id) ? 'yellow' : 'neutral'"
                  variant="ghost"
                  size="sm"
                  :class="{ 'text-yellow-500': isFavorite(server.Id) }"
                  @click.stop="toggleFavorite(server.Id)"
                />
                <UDropdownMenu :items="getContextMenuItems(server)">
                  <UButton icon="i-lucide-more-vertical" variant="ghost" color="neutral" size="sm" @click.stop />
                </UDropdownMenu>
                <UCheckbox
                  class="ml-1"
                  :model-value="selectedIds.has(server.Id)"
                  @update:model-value="toggleSelect(server.Id)"
                  @click.stop
                />
              </div>
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
            <UButton size="xs" :label="t('common.connect')" trailing-icon="i-lucide-chevron-right" @click.stop="handleConnect(server.Id)" />
          </template>
        </UCard>
      </UContextMenu>
    </div>

    <!-- List View -->
    <div v-else class="space-y-2 w-full">
      <div v-for="server in filteredServers" :key="server.Id" class="w-full">
        <UContextMenu :items="getContextMenuItems(server)" class="block w-full">
          <UCard
            class="group hover:ring-2 hover:ring-primary-500 transition-all duration-300 cursor-pointer w-full"
            @click="handleConnect(server.Id)"
            :ui="{ root: 'w-full max-w-none', body: 'p-3 flex items-center justify-between' }"
          >
            <div class="flex items-center gap-4 flex-1 min-w-0">
              <div class="shrink-0" @click.stop>
                <UCheckbox
                  :model-value="selectedIds.has(server.Id)"
                  @update:model-value="toggleSelect(server.Id)"
                />
              </div>
              <div class="p-2 rounded-lg bg-primary-500/10 text-primary-500 shrink-0">
                <UIcon :name="server.Protocol.toLowerCase().includes('ssh') ? 'i-lucide-terminal' : 'i-lucide-monitor'" class="w-5 h-5" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-bold text-zinc-900 dark:text-zinc-100 truncate">{{ server.DisplayName }}</div>
                <div class="text-xs text-zinc-500 flex items-center gap-2 truncate">
                  <span>{{ server.SubTitle }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <UBadge size="xs" variant="subtle" color="primary">{{ server.Protocol }}</UBadge>
              <UBadge v-for="tag in server.Tags.slice(0, 2)" :key="tag" size="xs" variant="subtle" color="neutral">{{ tag }}</UBadge>
              <UButton
                :icon="isFavorite(server.Id) ? 'i-lucide-star' : 'i-lucide-star'"
                :color="isFavorite(server.Id) ? 'yellow' : 'neutral'"
                variant="ghost"
                size="sm"
                @click.stop="toggleFavorite(server.Id)"
              />
              <UDropdownMenu :items="getContextMenuItems(server)">
                <UButton icon="i-lucide-more-vertical" variant="ghost" color="neutral" size="sm" @click.stop />
              </UDropdownMenu>
              <UButton icon="i-lucide-chevron-right" variant="ghost" color="neutral" size="sm" />
            </div>
          </UCard>
        </UContextMenu>
      </div>
    </div>

    <AddServerModal v-model="showAddModal" v-model:editing-id="editingId" @added="fetchServers" @updated="fetchServers" />
    <div v-if="hasSelection" class="sticky bottom-4 z-10 mt-6">
      <UCard class="ring-2 ring-primary-500/60 shadow-lg" :ui="{ body: 'p-3 flex items-center justify-between gap-4' }">
        <div class="flex items-center gap-2 text-base">
          <UButton class="text-base" size="xs" variant="ghost" color="neutral" :label="t('common.cancel', 'Cancel')" @click="clearSelection" />
          <span class="text-base text-zinc-500">
            {{ t('pages.dashboard.selected_count', '{count} selected', { count: selectedCount }) }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            class="text-base"
            size="xs"
            variant="outline"
            color="neutral"
            :label="t('pages.dashboard.select_all', 'Select all')"
            @click="selectAllFiltered"
            v-if="!isAllSelected"
          />
          <UButton class="text-base" size="xs" :label="t('common.connect')" @click="handleConnectSelected" />
          <UButton class="text-base" size="xs" color="error" variant="outline" :label="t('pages.dashboard.context_menu.delete')" @click="handleDeleteSelected" />
        </div>
      </UCard>
    </div>
  </div>
</template>
