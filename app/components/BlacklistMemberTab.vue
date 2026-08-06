<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { ref } from 'vue'
import AppTable, { type TableColumn } from '~/components/DynamicTableStyle.vue'
import { useFrontendI18n } from '~/composables/i18n'
import { useSnackbar } from '~/composables/useSnackbar'
import {
  getMembers,
  updateMemberJackpotStatus,
  type MemberItem,
} from '~/composables/service/membersApi'

const { t } = useFrontendI18n()
const { showSuccess, showError } = useSnackbar()

const itemsPerPage = ref(10)
const currentPage = ref(1)
const totalItems = ref(0)
const members = ref<MemberItem[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const searchMemberName = ref('')

const columns = computed<TableColumn<MemberItem>[]>(() => [
  { key: 'id', label: t('members.no'), type: 'index', width: '60px' },
  { key: 'user_name', label: t('members.member'), width: '160px' },
  { key: 'is_active', label: t('members.jackpotStatus'), width: '110px', align: 'center' },
])

const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalItems.value / itemsPerPage.value))
)

const filteredMembers = computed(() => {
  const q = searchMemberName.value.trim().toLowerCase()
  if (!q) return members.value
  return members.value.filter(m =>
    m.user_name?.toLowerCase().includes(q) ||
    m.login_id?.toLowerCase().includes(q) ||
    m.phone_number?.toLowerCase().includes(q)
  )
})

const jackpotUpdating = ref<Record<number, boolean>>({})

async function toggleJackpotStatus(item: MemberItem, newValue: boolean) {
  const prevValue = item.is_active
  item.is_active = newValue // optimistic update
  jackpotUpdating.value[item.id] = true

  try {
    const res = await updateMemberJackpotStatus(item.id, newValue)
    const payload = res?.data.value as { data: { is_active: boolean } } | undefined
    item.is_active = payload?.data?.is_active ?? newValue
    showSuccess(t('members.jackpotStatusUpdated'))
  } catch (e: any) {
    item.is_active = prevValue
    showError(e?.message ?? t('members.failedToUpdateJackpotStatus'))
  } finally {
    jackpotUpdating.value[item.id] = false
  }
}

async function fetchMembers() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await getMembers(currentPage.value, itemsPerPage.value)
    const payload = res?.data.value as
      { data: { members: MemberItem[] }; total: number } | undefined
    members.value = payload?.data?.members ?? []
    totalItems.value = payload?.total ?? 0
  } catch (e: any) {
    members.value = []
    totalItems.value = 0
    errorMessage.value = e?.message || t('members.failedToLoad')
    showError(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

watch(currentPage, fetchMembers)
onMounted(fetchMembers)
</script>

<template>
  <div class="flex-col gap-3">
    <div class="filters-row">
      <v-text-field v-model="searchMemberName" density="compact" variant="outlined" hide-details clearable
        prepend-inner-icon="mdi-magnify" :placeholder="t('jackpot.searchMemberName')" class="member-search" />

      <v-btn color="success" variant="flat" class="refresh-mini-btn" :loading="isLoading" @click="fetchMembers">
        <v-icon size="16" class="mr-1">mdi-refresh</v-icon>
        {{ t('gameConfig.refresh') }}
      </v-btn>
    </div>

    <div class="table-scroll">
      <AppTable :columns="columns" :items="filteredMembers" :loading="isLoading" :error="errorMessage"
        :page="currentPage" :page-size="itemsPerPage" :total-pages="totalPages" empty-height="450px"
        @update:page="currentPage = $event">
        <template #cell-is_active="{ item }">
          <div class="switch-wrap">
<v-switch
  :model-value="item.is_active"
  :class="item.is_active ? 'switch-active' : 'switch-inactive'"
  color="#00A300"
  density="compact"
  hide-details
  inset
  :loading="jackpotUpdating[item.id]"
  :disabled="jackpotUpdating[item.id]"
  @update:model-value="(val) => toggleJackpotStatus(item, val as boolean)"
/>
          </div>
        </template>
      </AppTable>
    </div>

  </div>
</template>

<style scoped>
.pagination-row {
  display: flex;
  justify-content: center;
}

.positive {
  color: #047857;
  font-weight: 600;
}

.switch-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
}

.switch-wrap :deep(.v-input__control) {
  display: flex;
  justify-content: center;
}

.switch-wrap :deep(.v-selection-control) {
  min-height: unset;
}

.switch-inactive :deep(.v-switch__track) {
  background-color: #E53935 !important;
  opacity: 1 !important;
}

.switch-inactive :deep(.v-switch__thumb) {
  color: #fff;
}
</style>