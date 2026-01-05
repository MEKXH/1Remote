<script setup lang="ts">
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
        <UButton icon="i-lucide-filter" variant="outline" label="Filter" color="neutral" />
      </div>
    </div>

    <!-- Stats / Quick Info -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
       <UCard v-for="(stat, idx) in ['Active Sessions', 'Total Servers', 'Favorites', 'Team Members']" :key="idx" :ui="{ body: 'p-4' }">
          <div class="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-semibold">{{ stat }}</div>
          <div class="text-2xl font-bold"> {{ [2, 124, 12, 5][idx] }}</div>
       </UCard>
    </div>

    <!-- Server List -->
    <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
      <UIcon name="i-lucide-list" />
      Recent Connections
    </h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard 
        v-for="i in 9" 
        :key="i"
        class="group hover:ring-2 hover:ring-primary-500 transition-all duration-300 cursor-pointer"
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
              <UIcon :name="i % 3 === 0 ? 'i-lucide-terminal' : (i % 2 === 0 ? 'i-lucide-cpu' : 'i-lucide-globe')" class="w-6 h-6" />
            </div>
            <UButton icon="i-lucide-more-vertical" variant="ghost" color="neutral" size="sm" />
          </div>
        </template>

        <div class="mt-2">
          <div class="font-bold text-lg leading-tight">Production Server-{{ i }}</div>
          <div class="text-sm text-zinc-500 flex items-center gap-1 mt-1">
            <UIcon name="i-lucide-hash" size="14" />
            192.168.1.{{ 10 + i }}
          </div>
        </div>

        <template #footer>
          <div class="flex items-center gap-1">
            <UBadge size="sm" variant="subtle" color="primary">SSH</UBadge>
            <UBadge size="sm" variant="subtle" color="neutral">Linux</UBadge>
          </div>
          <UButton size="xs" label="Connect" trailing-icon="i-lucide-chevron-right" />
        </template>
      </UCard>
    </div>
  </div>
</template>
