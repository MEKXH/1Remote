<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme, primaryColors } from '../composables/useTheme'

const { t, locale } = useI18n()
const { isDark, setDarkMode, primaryColor, setPrimaryColor, initTheme } = useTheme()

const loading = ref(false)
const activeSection = ref('appearance')
const isSidebarOpen = ref(false)

// Define settings sections for sidebar navigation
const sections = computed(() => [
  { id: 'appearance', icon: 'i-lucide-palette', label: t('pages.settings.appearance.title') },
  { id: 'general', icon: 'i-lucide-settings', label: t('pages.settings.general.title') },
  { id: 'connection', icon: 'i-lucide-plug', label: t('pages.settings.connection.title') },
  { id: 'display', icon: 'i-lucide-monitor', label: t('pages.settings.display.title') },
  { id: 'security', icon: 'i-lucide-shield', label: t('pages.settings.security.title') },
  { id: 'notifications', icon: 'i-lucide-bell', label: t('pages.settings.notifications.title') },
  { id: 'about', icon: 'i-lucide-info', label: t('pages.settings.about.title') }
])

const selectSection = (sectionId: string) => {
  activeSection.value = sectionId
  isSidebarOpen.value = false // Close sidebar on mobile after selection
}

// General Settings
const language = ref(locale.value)
const languages = [
  { label: 'English', value: 'en-us' },
  { label: '简体中文', value: 'zh-cn' },
  { label: '繁體中文', value: 'zh-tw' },
  { label: '日本語', value: 'ja-jp' },
]

// Map backend language code to locale
const backendToLocale = (code: string) => {
  const low = code.toLowerCase()
  if (low === 'en-us') return 'en'
  if (low === 'zh-cn') return 'zh-CN'
  if (low === 'zh-tw') return 'zh-TW'
  if (low === 'ja-jp') return 'ja'
  return code
}

const doNotCheckNewVersion = ref(false)
const launchAtStartup = ref(false)
const closeButtonBehavior = ref(1) // 1 = Minimize
const confirmBeforeClosingSession = ref(false)
const showSessionIconInSessionWindow = ref(true)
const logLevel = ref(2)
const showInTaskbar = ref(true)

// Connection Settings
const defaultProtocol = ref('RDP')
const protocols = ['RDP', 'SSH', 'VNC', 'Telnet']
const connectionTimeout = ref(30)
const keepAliveInterval = ref(60)
const autoReconnect = ref(true)
const maxReconnectAttempts = ref(3)

// Security Settings
const rememberPasswords = ref(true)
const lockOnMinimize = ref(false)
const clearClipboardOnDisconnect = ref(false)
const requirePasswordOnStart = ref(false)

// Display Settings
const defaultWindowMode = ref('windowed')
const windowModes = computed(() => [
  { label: t('pages.settings.display.modes.windowed'), value: 'windowed' },
  { label: t('pages.settings.display.modes.fullscreen'), value: 'fullscreen' },
  { label: t('pages.settings.display.modes.borderless'), value: 'borderless' },
])
const showConnectionStatus = ref(true)

// Notification Settings
const enableNotifications = ref(true)
const notifyOnConnect = ref(true)
const notifyOnDisconnect = ref(true)
const playSounds = ref(false)

const fetchSettings = async () => {
  loading.value = true
  try {
    const general = await window.electronAPI.getGeneralSettings()
    if (general) {
      language.value = general.Language.toLowerCase()
      locale.value = backendToLocale(general.Language)
      doNotCheckNewVersion.value = general.DoNotCheckNewVersion
      closeButtonBehavior.value = general.CloseButtonBehavior
      confirmBeforeClosingSession.value = general.ConfirmBeforeClosingSession
      showSessionIconInSessionWindow.value = general.ShowSessionIconInSessionWindow
      logLevel.value = general.LogLevel
    }

    const theme = await window.electronAPI.getThemeSettings()
    if (theme) {
      setDarkMode(theme.ThemeName === 'Dark')
    }
  } catch (e) {
    console.error('Failed to fetch settings:', e)
  } finally {
    loading.value = false
  }
}

const saveGeneralSettings = async () => {
  try {
    await window.electronAPI.updateGeneralSettings({
      Language: language.value,
      DoNotCheckNewVersion: doNotCheckNewVersion.value,
      AppStartAutomatically: launchAtStartup.value,
      CloseButtonBehavior: closeButtonBehavior.value,
      ConfirmBeforeClosingSession: confirmBeforeClosingSession.value,
      ShowSessionIconInSessionWindow: showSessionIconInSessionWindow.value,
      LogLevel: logLevel.value
    })
  } catch (e) {
    console.error('Failed to save general settings:', e)
  }
}

watch(language, (val) => {
  locale.value = backendToLocale(val)
  saveGeneralSettings()
})

watch([doNotCheckNewVersion, closeButtonBehavior, confirmBeforeClosingSession, showSessionIconInSessionWindow, logLevel, launchAtStartup], () => {
  saveGeneralSettings()
})

watch(isDark, async (val) => {
  try {
    await window.electronAPI.updateThemeSettings({
      ThemeName: val ? 'Dark' : 'Light',
      AccentMidColor: '' // Keep current
    })
  } catch (e) {
    console.error('Failed to save theme settings:', e)
  }
})

onMounted(async () => {
  initTheme()
  await fetchSettings()
})
</script>

<template>
  <div class="flex h-full relative bg-default">
    <!-- Mobile Overlay -->
    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="isSidebarOpen = false"
    />

    <!-- Sidebar -->
    <div
      class="w-64 flex-shrink-0 bg-muted transition-transform duration-200 ease-in-out lg:translate-x-0 z-50 flex flex-col lg:m-2 lg:rounded-xl lg:border lg:border-default border-e border-default lg:border-e-0"
      :class="isSidebarOpen ? 'fixed inset-y-0 left-0 translate-x-0 rounded-none' : 'hidden lg:flex'"
    >
      <div class="p-6 border-b border-default lg:rounded-t-xl">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h1 class="text-xl font-bold text-highlighted">{{ t('pages.settings.title') }}</h1>
            <p class="text-xs text-muted mt-1">{{ t('pages.settings.subtitle') }}</p>
          </div>
          <!-- Close button for mobile -->
          <button
            class="lg:hidden p-1 hover:bg-elevated rounded-md flex-shrink-0 ml-2 transition-colors"
            @click="isSidebarOpen = false"
          >
            <UIcon name="i-lucide-x" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto p-4 space-y-1">
        <button
          v-for="section in sections"
          :key="section.id"
          @click="selectSection(section.id)"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          :class="activeSection === section.id
            ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
            : 'text-toned hover:bg-elevated hover:text-highlighted'"
        >
          <UIcon :name="section.icon" class="w-5 h-5 flex-shrink-0" />
          <span class="text-left">{{ section.label }}</span>
        </button>
      </nav>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto">
      <div class="p-4 lg:p-6 max-w-4xl mx-auto">
        <!-- Mobile Header with Menu Button -->
        <div class="flex items-center justify-between mb-6 lg:hidden">
          <button
            class="p-2 hover:bg-elevated rounded-md transition-colors"
            @click="isSidebarOpen = true"
          >
            <UIcon name="i-lucide-menu" class="w-5 h-5" />
          </button>
          <h1 class="text-xl font-bold text-highlighted">
            {{ sections.find(s => s.id === activeSection)?.label }}
          </h1>
          <div class="w-9" /><!-- Spacer for alignment -->
        </div>

        <div v-if="loading" class="flex justify-center py-12">
          <UButton loading variant="ghost" />
        </div>

        <div v-else class="space-y-6">
      <!-- Appearance Section -->
      <UCard v-show="activeSection === 'appearance'">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-palette" class="w-5 h-5 text-primary" />
            <h2 class="font-semibold">{{ t('pages.settings.appearance.title') }}</h2>
          </div>
        </template>

        <div class="space-y-6">
          <!-- Dark Mode -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.appearance.dark_mode') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.appearance.dark_mode_desc') }}</div>
            </div>
            <USwitch v-model="isDark" @update:model-value="setDarkMode" />
          </div>

          <USeparator />

          <!-- Primary Color -->
          <div>
            <div class="font-medium mb-1">{{ t('pages.settings.appearance.primary_color') }}</div>
            <div class="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{{ t('pages.settings.appearance.primary_color_desc') }}</div>
            <div class="flex flex-wrap gap-3">
              <button
                v-for="color in primaryColors"
                :key="color.name"
                class="group relative w-10 h-10 rounded-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900"
                :class="[primaryColor === color.name ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 scale-110' : '']"
                :style="{ backgroundColor: color.value, '--tw-ring-color': color.value }"
                :title="color.label"
                @click="setPrimaryColor(color.name)"
              >
                <UIcon
                  v-if="primaryColor === color.name"
                  name="i-lucide-check"
                  class="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                />
              </button>
            </div>
          </div>
        </div>
      </UCard>

      <!-- General Section -->
      <UCard v-show="activeSection === 'general'">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-settings" class="w-5 h-5 text-primary" />
            <h2 class="font-semibold">{{ t('pages.settings.general.title') }}</h2>
          </div>
        </template>

        <div class="space-y-6">
          <!-- Language -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.general.language') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.general.language_desc') }}</div>
            </div>
            <USelect v-model="language" :items="languages" class="w-40" value-key="value" />
          </div>

          <USeparator />

          <!-- Close behavior -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.general.minimize_tray') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.general.minimize_tray_desc') }}</div>
            </div>
            <USwitch :model-value="closeButtonBehavior === 1" @update:model-value="closeButtonBehavior = $event ? 1 : 0" />
          </div>

          <USeparator />

          <!-- Confirm closing -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.connection.confirm_close') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.connection.confirm_close_desc') }}</div>
            </div>
            <USwitch v-model="confirmBeforeClosingSession" />
          </div>
          
          <USeparator />

          <!-- Update check -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.general.check_updates') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.general.check_updates_desc') }}</div>
            </div>
            <USwitch v-model="doNotCheckNewVersion" />
          </div>

          <USeparator />

          <!-- Show in Taskbar -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.general.show_taskbar') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.general.show_taskbar_desc') }}</div>
            </div>
            <USwitch v-model="showInTaskbar" />
          </div>
        </div>
      </UCard>

      <!-- Connection Section -->
      <UCard v-show="activeSection === 'connection'">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-plug" class="w-5 h-5 text-primary" />
            <h2 class="font-semibold">{{ t('pages.settings.connection.title') }}</h2>
          </div>
        </template>

        <div class="space-y-6">
          <!-- Default Protocol -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.connection.default_protocol') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.connection.default_protocol_desc') }}</div>
            </div>
            <USelect v-model="defaultProtocol" :items="protocols" class="w-32" />
          </div>

          <USeparator />

          <!-- Connection Timeout -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.connection.timeout') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.connection.timeout_desc') }}</div>
            </div>
            <div class="flex items-center gap-2">
              <UInput v-model.number="connectionTimeout" type="number" class="w-20" :min="5" :max="120" />
              <span class="text-sm text-zinc-500">sec</span>
            </div>
          </div>

          <USeparator />

          <!-- Keep Alive Interval -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.connection.keep_alive') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.connection.keep_alive_desc') }}</div>
            </div>
            <div class="flex items-center gap-2">
              <UInput v-model.number="keepAliveInterval" type="number" class="w-20" :min="0" :max="300" />
              <span class="text-sm text-zinc-500">sec</span>
            </div>
          </div>

          <USeparator />

          <!-- Auto Reconnect -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.connection.auto_reconnect') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.connection.auto_reconnect_desc') }}</div>
            </div>
            <USwitch v-model="autoReconnect" />
          </div>

          <USeparator />

          <!-- Max Reconnect Attempts -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.connection.max_reconnect') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.connection.max_reconnect_desc') }}</div>
            </div>
            <UInput v-model.number="maxReconnectAttempts" type="number" class="w-20" :min="1" :max="10" :disabled="!autoReconnect" />
          </div>
        </div>
      </UCard>

      <!-- Display Section -->
      <UCard v-show="activeSection === 'display'">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-monitor" class="w-5 h-5 text-primary" />
            <h2 class="font-semibold">{{ t('pages.settings.display.title') }}</h2>
          </div>
        </template>

        <div class="space-y-6">
          <!-- Default Window Mode -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.display.window_mode') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.display.window_mode_desc') }}</div>
            </div>
            <USelect v-model="defaultWindowMode" :items="windowModes" class="w-36" value-key="value" />
          </div>

          <USeparator />

          <!-- Show Connection Status -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.display.show_status') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.display.show_status_desc') }}</div>
            </div>
            <USwitch v-model="showConnectionStatus" />
          </div>
        </div>
      </UCard>

      <!-- Security Section -->
      <UCard v-show="activeSection === 'security'">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-shield" class="w-5 h-5 text-primary" />
            <h2 class="font-semibold">{{ t('pages.settings.security.title') }}</h2>
          </div>
        </template>

        <div class="space-y-6">
          <!-- Remember Passwords -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.security.remember_passwords') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.security.remember_passwords_desc') }}</div>
            </div>
            <USwitch v-model="rememberPasswords" />
          </div>

          <USeparator />

          <!-- Lock on Minimize -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.security.lock_minimize') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.security.lock_minimize_desc') }}</div>
            </div>
            <USwitch v-model="lockOnMinimize" />
          </div>

          <USeparator />

          <!-- Clear Clipboard -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.security.clear_clipboard') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.security.clear_clipboard_desc') }}</div>
            </div>
            <USwitch v-model="clearClipboardOnDisconnect" />
          </div>

          <USeparator />

          <!-- Require Password on Start -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.security.require_password') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.security.require_password_desc') }}</div>
            </div>
            <USwitch v-model="requirePasswordOnStart" />
          </div>
        </div>
      </UCard>

      <!-- Notifications Section -->
      <UCard v-show="activeSection === 'notifications'">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-bell" class="w-5 h-5 text-primary" />
            <h2 class="font-semibold">{{ t('pages.settings.notifications.title') }}</h2>
          </div>
        </template>

        <div class="space-y-6">
          <!-- Enable Notifications -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.notifications.enable') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.notifications.enable_desc') }}</div>
            </div>
            <USwitch v-model="enableNotifications" />
          </div>

          <USeparator />

          <!-- Notify on Connect -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.notifications.on_connect') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.notifications.on_connect_desc') }}</div>
            </div>
            <USwitch v-model="notifyOnConnect" :disabled="!enableNotifications" />
          </div>

          <USeparator />

          <!-- Notify on Disconnect -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.notifications.on_disconnect') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.notifications.on_disconnect_desc') }}</div>
            </div>
            <USwitch v-model="notifyOnDisconnect" :disabled="!enableNotifications" />
          </div>

          <USeparator />

          <!-- Play Sounds -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">{{ t('pages.settings.notifications.play_sounds') }}</div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.notifications.play_sounds_desc') }}</div>
            </div>
            <USwitch v-model="playSounds" :disabled="!enableNotifications" />
          </div>
        </div>
      </UCard>

      <!-- About Section -->
      <UCard v-show="activeSection === 'about'">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-info" class="w-5 h-5 text-primary" />
            <h2 class="font-semibold">{{ t('pages.settings.about.title') }}</h2>
          </div>
        </template>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.about.version') }}</div>
            <UBadge variant="subtle" color="primary">1.3.0</UBadge>
          </div>

          <div class="flex items-center justify-between">
            <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.about.framework') }}</div>
            <div class="text-sm">Electron + Vue 3</div>
          </div>

          <div class="flex items-center justify-between">
            <div class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('pages.settings.about.ui_library') }}</div>
            <div class="text-sm">Nuxt UI v4</div>
          </div>

          <USeparator />

          <div class="flex gap-2">
            <UButton variant="outline" color="neutral" icon="i-lucide-github" :label="t('pages.settings.about.github')" />
            <UButton variant="outline" color="neutral" icon="i-lucide-book-open" :label="t('pages.settings.about.documentation')" />
            <UButton variant="outline" color="neutral" icon="i-lucide-message-circle" :label="t('pages.settings.about.feedback')" />
          </div>
        </div>
      </UCard>
        </div>
      </div>
    </div>
  </div>
</template>