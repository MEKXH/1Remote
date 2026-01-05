<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { IServerCreateDto } from '../electron-api'

const { t } = useI18n()
const open = defineModel<boolean>({ default: false })
const editingId = defineModel<string | null>('editingId', { default: null })

const emit = defineEmits<{
  (e: 'added'): void
  (e: 'updated'): void
}>()

const form = reactive<IServerCreateDto>({
  DisplayName: '',
  Protocol: 'RDP',
  Host: '',
  Port: '',
  Username: '',
  Password: ''
})

const loading = ref(false)
const error = ref('')

const protocols = ['RDP', 'SSH']

const resetForm = () => {
  form.DisplayName = ''
  form.Host = ''
  form.Port = ''
  form.Username = ''
  form.Password = ''
  form.Protocol = 'RDP'
  error.value = ''
}

const fetchServerDetails = async (id: string) => {
  loading.value = true
  try {
    const details = await window.electronAPI.getServer(id)
    if (details) {
      Object.assign(form, details)
    }
  } catch (e: any) {
    error.value = e.message || t('common.unknown_error')
  } finally {
    loading.value = false
  }
}

// Reset form when modal closes, or fetch details when editingId changes
watch(open, (val) => {
  if (!val) {
    resetForm()
    editingId.value = null
  } else if (editingId.value) {
    fetchServerDetails(editingId.value)
  }
})

const handleClose = () => {
  open.value = false
}

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    if (!form.Port) {
      form.Port = form.Protocol === 'RDP' ? '3389' : '22'
    }

    if (editingId.value) {
      const result = await window.electronAPI.updateServer(editingId.value, { ...form })
      if (result.IsSuccess) {
        await new Promise(resolve => setTimeout(resolve, 300))
        emit('updated')
        open.value = false
      } else {
        error.value = result.ErrorInfo || t('components.add_server.failed')
      }
    } else {
      const result = await window.electronAPI.addServer({ ...form })
      if (result.IsSuccess) {
        await new Promise(resolve => setTimeout(resolve, 300))
        emit('added')
        open.value = false
      } else {
        error.value = result.ErrorInfo || t('components.add_server.failed')
      }
    }
  } catch (e: any) {
    error.value = e.message || t('common.unknown_error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open"
    :title="editingId ? t('pages.dashboard.context_menu.edit') : t('components.add_server.title')"
    :ui="{ footer: 'justify-end' }">
    <template #body>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <UFormField :label="t('components.add_server.protocol')" name="protocol">
          <USelect v-model="form.Protocol" :items="protocols" class="w-full" />
        </UFormField>

        <UFormField :label="t('components.add_server.display_name')" name="displayName" required>
          <UInput v-model="form.DisplayName" :placeholder="t('components.add_server.display_name_placeholder')"
            autofocus />
        </UFormField>

        <div class="grid grid-cols-3 gap-4">
          <UFormField :label="t('components.add_server.host')" name="host" required class="col-span-2">
            <UInput v-model="form.Host" :placeholder="t('components.add_server.host_placeholder')" />
          </UFormField>
          <UFormField :label="t('components.add_server.port')" name="port">
            <UInput v-model="form.Port" :placeholder="form.Protocol === 'RDP' ? '3389' : '22'" />
          </UFormField>
        </div>

        <UFormField :label="t('components.add_server.username')" name="username">
          <UInput v-model="form.Username" :placeholder="t('components.add_server.username_placeholder')" />
        </UFormField>

        <UFormField :label="t('components.add_server.password')" name="password">
          <UInput v-model="form.Password" type="password"
            :placeholder="t('components.add_server.password_placeholder')" />
        </UFormField>

        <div v-if="error" class="text-red-500 text-sm">
          {{ error }}
        </div>
      </form>
    </template>

    <template #footer>
      <UButton color="neutral" variant="ghost" :label="t('components.add_server.cancel')" @click="handleClose" />
      <UButton color="primary" :label="t('components.add_server.save')" :loading="loading" @click="handleSubmit" />
    </template>
  </UModal>
</template>
