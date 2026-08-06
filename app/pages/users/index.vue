<template>
  <div class="users-page">
    <!-- Header -->
    <div class="page-header mt-3">
      <div class="header-left">
        <div class="header-icon">
          <v-icon size="22" color="primary">mdi-account-multiple-outline</v-icon>
        </div>
        <div>
          <h1 class="page-title">{{ t('users.title') }}</h1>
          <!-- <p class="page-subtitle">{{ users.length }} {{ t('common.total') }}</p> -->
        </div>
      </div>

      <!-- <v-btn class="btn-primary" prepend-icon="mdi-plus" @click="openCreateUserDialog">
        {{ t('users.addUser') }}
      </v-btn> -->
    </div>

    <!-- Content Card -->
    <div class="content-card">
      <div class="toolbar">
        <v-text-field v-model="userSearch" :placeholder="t('users.username')" prepend-inner-icon="mdi-magnify"
          density="compact" variant="outlined" hide-details class="search-field" clearable />

        <v-btn color="create" prepend-icon="mdi-plus" @click="openCreateUserDialog">
          {{ t('users.addUser') }}
        </v-btn>
      </div>

      <AppTable :columns="userColumns" :items="filteredUsers" :loading="userLoading" :error="userError" :page="userPage"
        :page-size="userPageSize" :total-pages="userTotalPages" @update:page="userPage = $event">
        <template #cell-username="{ item }">
          <div class="user-cell">
            <div class="avatar" :style="{ background: avatarColor(item.username) }">
              {{ getInitials(item.username) }}
            </div>
            <div class="user-info">
              <div class="user-name">{{ item.username }}</div>
              <div class="user-email">{{ item.email }}</div>
            </div>
          </div>
        </template>

        <template #cell-role="{ item }">
          <span class="role-badge" :class="roleBadgeClass(item.role)">{{ item.role }}</span>
        </template>

        <template #cell-actions="{ item }">
          <v-btn size="small" variant="outlined" class="assign-btn" prepend-icon="mdi-key-variant"
            @click="openAssignDialog(item)">
            {{ t('users.assignMenus') }}
          </v-btn>
        </template>
      </AppTable>
    </div>

    <!-- CREATE USER -->
    <v-dialog v-model="createUserDialog" max-width="600">
      <v-card class="dialog-card">
        <div class="dialog-header">
          <div class="dialog-title-row">
            <div class="dialog-icon">
              <v-icon size="20" color="primary">mdi-account-plus-outline</v-icon>
            </div>
            <h2>{{ t('users.createNewUser') }}</h2>
          </div>

          <v-btn icon size="small" variant="text" @click="createUserDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <v-divider />

        <div class="dialog-body">
          <div class="form-grid">
            <div class="form-group half">
              <label class="form-label">{{ t('users.username') }} <span class="required">*</span></label>
              <v-text-field
                v-model="userForm.user_name"
                placeholder="e.g. ADMIN006"
                density="compact"
                variant="outlined"
                hide-details="auto"
                @update:model-value="value => { userForm.user_name = String(value ?? '').toUpperCase() }"
              />
            </div>

            <div class="form-group half">
              <label class="form-label">{{ t('users.nickname') }}</label>
              <v-text-field v-model="userForm.nickname" placeholder="e.g. noch" density="compact" variant="outlined"
                hide-details />
            </div>
            <div class="form-group half">
              <label class="form-label">{{ t('users.password') }} <span class="required">*</span></label>
              <v-text-field v-model="userForm.password" :type="showPassword ? 'text' : 'password'" placeholder="••••••"
                density="compact" variant="outlined" hide-details="auto"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword" />
            </div>

            <div class="form-group half">
              <label class="form-label">{{ t('users.email') }} <span class="required">*</span></label>
              <v-text-field v-model="userForm.email" placeholder="e.g. admin@example.com" density="compact"
                variant="outlined" hide-details="auto" />
            </div>

            <!-- <div class="form-group half">
              <label class="form-label">{{ t('users.profile') }}</label>
              <v-text-field v-model="userForm.profile" placeholder="e.g. admin" density="compact" variant="outlined"
                hide-details />
            </div> -->

            <div class="form-group full">
              <div class="section-label-row">
                <label class="form-label no-margin">{{ t('users.assignMenus') }}</label>
                <span class="assign-count">{{ userForm.menu_ids.length }} / {{ allMenus.length }}</span>
              </div>

              <div class="assign-menu-grid" style="max-height: 220px;">
                <div v-for="menu in allMenus" :key="menu.id" class="assign-menu-item"
                  :class="{ selected: isCreateMenuSelected(menu.id) }" @click="toggleUserMenu(menu.id)">
                  <div class="assign-menu-left">
                    <v-icon size="18" :color="isCreateMenuSelected(menu.id) ? 'primary' : '#9CA3AF'">
                      {{ menu.icon }}
                    </v-icon>

                    <span class="assign-menu-name">{{ menu.name }}</span>
                  </div>

                  <v-icon size="18" :color="isCreateMenuSelected(menu.id) ? 'primary' : '#D1D5DB'">
                    {{ isCreateMenuSelected(menu.id) ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline' }}
                  </v-icon>
                </div>
              </div>
            </div>
          </div>
        </div>

        <v-divider />

        <div class="dialog-actions">
          <v-btn variant="outlined" color="cancel" @click="createUserDialog = false">{{ t('common.cancel') }}</v-btn>

          <v-btn color="create" :loading="createUserLoading" @click="submitCreateUser">
            {{ t('users.createUser') }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- ASSIGN USER MENUS -->
    <v-dialog v-model="assignDialog" max-width="600">
      <v-card class="dialog-card">
        <div class="dialog-header">
          <div class="dialog-title-row">
            <div class="dialog-icon">
              <v-icon size="20" color="primary">mdi-key-variant</v-icon>
            </div>
            <div>
              <h2>{{ t('users.assignMenus') }}</h2>
              <p v-if="selectedUser" class="dialog-subtitle">{{ selectedUser.username }}</p>
            </div>
          </div>

          <v-btn icon size="small" variant="text" @click="assignDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <v-divider />

        <div class="dialog-body">
          <div v-if="assignLoading" class="loading-state">
            <v-progress-circular indeterminate color="primary" size="28" />
            <span>{{ t('users.loadingMenus') }}</span>
          </div>

          <template v-else>
            <div class="section-label-row">
              <span class="assign-count">{{ assignedMenuIds.length }} / {{ allMenus.length }} {{
                t('users.assignMenus').toLowerCase() }}</span>
            </div>

            <div class="assign-menu-grid">
              <div v-for="menu in allMenus" :key="menu.id" class="assign-menu-item"
                :class="{ selected: isMenuAssigned(menu.id) }" @click="toggleMenu(menu.id)">
                <div class="assign-menu-left">
                  <v-icon size="18" :color="isMenuAssigned(menu.id) ? 'primary' : '#9CA3AF'">
                    {{ menu.icon }}
                  </v-icon>

                  <span class="assign-menu-name">{{ menu.name }}</span>
                </div>

                <v-icon size="18" :color="isMenuAssigned(menu.id) ? 'primary' : '#D1D5DB'">
                  {{ isMenuAssigned(menu.id) ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline' }}
                </v-icon>
              </div>
            </div>
          </template>
        </div>

        <v-divider />

        <div class="dialog-actions">
          <v-btn variant="outlined" color="cancel" @click="assignDialog = false">{{ t('common.cancel') }}</v-btn>

          <v-btn color="primary" :loading="assignSaving" @click="submitAssign">
            {{ t('users.saveAssignment') }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppTable, { type TableColumn } from '~/components/DynamicTableStyle.vue'
import { useFrontendI18n } from '~/composables/i18n'
import { useSnackbar } from '@/composables/useSnackbar'
import {
  assignUserMenus,
  createUser,
  getMenus,
  getUserMenus,
  getUsers,
  type MenuItem,
  type UserItem,
} from '~/composables/service/adminManagementApi'

const { showSuccess, showError } = useSnackbar()
const { t } = useFrontendI18n()

type Menu = MenuItem

const allMenus = ref<Menu[]>([])

async function fetchMenus() {
  try {
    const res = await getMenus()
    if (!res) return

    allMenus.value = res.data.value?.data?.menus ?? []

    if (createUserDialog.value && userForm.value.menu_ids.length === 0) {
      userForm.value.menu_ids = allMenus.value.map(menu => menu.id)
    }
  }
  catch {
    // silent
  }
}

interface User {
  id: number
  user_uuid: string
  username: string
  login_id: string
  email: string
  nickname: string
  profile: string
  role: string
  status_id: number
  created_at: string
}

const users = ref<User[]>([])
const userLoading = ref(false)
const userError = ref('')
const userSearch = ref('')
const userPage = ref(1)
const userPageSize = 10
const userTotalPages = ref(1)

const userColumns = computed<TableColumn<User>[]>(() => [
  { key: 'id', label: t('members.no'), type: 'index', width: '48px' },
  { key: 'username', label: t('members.member'), align: 'left' },
  { key: 'role', label: t('users.profile'), width: '120px' },
  { key: 'actions', label: t('common.actions'), width: '160px' },
])

const filteredUsers = computed(() =>
  users.value.filter(u =>
    !userSearch.value ||
    u.username.toLowerCase().includes(userSearch.value.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.value.toLowerCase()),
  ),
)

async function fetchUsers() {
  userLoading.value = true
  userError.value = ''

  try {
    const res = await getUsers()
    if (!res) return

    users.value = (res.data.value?.data?.users ?? []).map((user: UserItem) => ({
      id: user.id,
      user_uuid: user.user_uuid,
      username: user.user_name,
      login_id: user.login_id,
      email: user.email,
      nickname: user.nickname,
      profile: user.profile,
      role: user.role_name,
      status_id: user.status_id,
      created_at: user.created_at,
    }))

    userTotalPages.value = 1
  }
  catch (e: any) {
    userError.value = e?.message ?? t('users.failedToLoad')
  }
  finally {
    userLoading.value = false
  }
}

function getInitials(name: string) {
  return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '??'
}

// deterministic avatar color per username — first swatch is the theme primary,
// the rest are a complementary spread so avatars stay visually distinct.
const AVATAR_PALETTE = ['rgb(var(--v-theme-primary))', '#A78BFA', '#60A5FA', '#34D399', '#F59E0B', '#F87171']

function avatarColor(name: string) {
  if (!name) return AVATAR_PALETTE[0]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % AVATAR_PALETTE.length
  }

  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

function roleBadgeClass(role: string) {
  const normalized = (role || '').toLowerCase()

  if (normalized.includes('super') || normalized.includes('admin')) return 'role-admin'
  if (normalized.includes('manager')) return 'role-manager'

  return 'role-default'
}

// CREATE USER
const createUserDialog = ref(false)
const createUserLoading = ref(false)
const showPassword = ref(false)

const defaultUserForm = () => ({
  user_name: '',
  login_id: '',
  password: '',
  email: '',
  nickname: '',
  profile: 'admin',
  menu_ids: allMenus.value.map(menu => menu.id) as number[],
})

const userForm = ref(defaultUserForm())

async function openCreateUserDialog() {
  if (allMenus.value.length === 0) {
    await fetchMenus()
  }

  userForm.value = defaultUserForm()
  showPassword.value = false
  createUserDialog.value = true
}

function isCreateMenuSelected(menuId: number) {
  return userForm.value.menu_ids.includes(menuId)
}

function toggleUserMenu(menuId: number) {
  const idx = userForm.value.menu_ids.indexOf(menuId)

  if (idx === -1) {
    userForm.value.menu_ids.push(menuId)
  }
  else {
    userForm.value.menu_ids.splice(idx, 1)
  }
}

async function submitCreateUser() {
  userForm.value.user_name = userForm.value.user_name.toUpperCase()

  const { user_name, login_id, password, email } = userForm.value

  if (!user_name || !login_id || !password || !email) {
    showError(t('common.fieldRequired'))
    return
  }

  createUserLoading.value = true

  try {
    await createUser(userForm.value)

    showSuccess(t('users.createdSuccessfully'))
    createUserDialog.value = false

    await fetchUsers()
  }
  catch (e: any) {
    showError(e?.message ?? t('users.createUser'))
  }
  finally {
    createUserLoading.value = false
  }
}

// ASSIGN MENUS
const assignDialog = ref(false)
const assignLoading = ref(false)
const assignSaving = ref(false)
const selectedUser = ref<User | null>(null)
const assignedMenuIds = ref<number[]>([])

function isMenuAssigned(menuId: number) {
  return assignedMenuIds.value.includes(menuId)
}

function toggleMenu(menuId: number) {
  const idx = assignedMenuIds.value.indexOf(menuId)

  if (idx === -1) {
    assignedMenuIds.value.push(menuId)
  }
  else {
    assignedMenuIds.value.splice(idx, 1)
  }
}

async function openAssignDialog(user: User) {
  selectedUser.value = user
  assignedMenuIds.value = []
  assignDialog.value = true
  assignLoading.value = true

  try {
    const res = await getUserMenus(user.id)
    if (!res) return

    const assigned: Menu[] = res.data.value?.data?.menus ?? []
    assignedMenuIds.value = assigned.map(menu => menu.id)
  }
  catch {
    assignedMenuIds.value = []
  }
  finally {
    assignLoading.value = false
  }
}

async function submitAssign() {
  if (!selectedUser.value) return

  assignSaving.value = true

  try {
    await assignUserMenus(selectedUser.value.id, assignedMenuIds.value)

    showSuccess(t('users.assignedSuccessfully'))
    assignDialog.value = false
  }
  catch (e: any) {
    showError(e?.message ?? t('users.assignMenus'))
  }
  finally {
    assignSaving.value = false
  }
}

onMounted(() => {
  fetchUsers()
  fetchMenus()
})
</script>

<style scoped>
.users-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ═══════════ HEADER ═══════════ */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.page-title {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: rgb(var(--v-theme-primary));
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 12.5px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  margin: 2px 0 0;
}

.btn-primary {
  background: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
  font-weight: 600;
  letter-spacing: 0;
  border-radius: 10px !important;
  box-shadow: 0 4px 14px rgba(var(--v-theme-primary), 0.35) !important;
}

/* ═══════════ CONTENT CARD ═══════════ */
.content-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.search-field {
  max-width: 300px;
}

.search-field :deep(.v-field) {
  border-radius: 10px;
}

/* border color + width when focused */
.search-field :deep(.v-field--focused .v-field__outline) {
  color: rgb(var(--v-theme-primary)) !important;
  --v-field-border-width: 2px;
}

/* prepend icon color when focused */
.search-field :deep(.v-field--focused .v-field__prepend-inner) {
  color: rgb(var(--v-theme-primary));
}

/* label color when focused (if you add a label) */
.search-field :deep(.v-field--focused .v-label) {
  color: rgb(var(--v-theme-primary));
}

/* clear icon color when focused (optional) */
.search-field :deep(.v-field--focused .v-field__clearable) {
  color: rgb(var(--v-theme-primary));
}

.refresh-btn {
  border-radius: 10px !important;
  border-color: rgba(var(--v-theme-on-surface), 0.15) !important;
  color: #6B7280 !important;
  flex-shrink: 0;
}

/* ═══════════ USER CELL ═══════════ */
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: rgb(var(--v-theme-on-primary));
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-info {
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.user-email {
  font-size: 11px;
  color: #9CA3AF;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ═══════════ ROLE BADGE ═══════════ */
.role-badge {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 3px 10px;
  border-radius: 20px;
  white-space: nowrap;
}

.role-badge.role-admin {
  background: rgba(var(--v-theme-primary), 0.14);
  color: rgb(var(--v-theme-primary));
}

.role-badge.role-manager {
  background: rgba(96, 165, 250, 0.14);
  color: #1D4ED8;
}

.role-badge.role-default {
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.assign-btn {
  border-radius: 8px !important;
  border-color: rgba(var(--v-theme-on-surface), 0.15) !important;
  color: rgba(var(--v-theme-on-surface), 0.7) !important;
  font-size: 12px !important;
}

/* ═══════════ LOADING ═══════════ */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px;
  color: #6B7280;
  font-size: 14px;
}

/* ═══════════ DIALOG ═══════════ */
.dialog-card {
  border-radius: 14px !important;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 20px 16px;
}

.dialog-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dialog-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dialog-title-row h2 {
  font-size: 16px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.dialog-subtitle {
  font-size: 12px;
  color: #9CA3AF;
  margin: 2px 0 0;
}

.dialog-body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.dialog-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  background: rgb(var(--v-theme-background));
}

/* ═══════════ FORM ═══════════ */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-group.full {
  grid-column: 1 / -1;
}

.form-group.half {
  grid-column: span 1;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.75);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.form-label.no-margin {
  margin-bottom: 0;
}

.section-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.required {
  color: rgb(var(--v-theme-error));
}

/* ═══════════ MENU ASSIGNMENT GRID ═══════════ */
.assign-menu-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  overflow-y: auto;
}

.assign-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.assign-menu-item:hover {
  background: rgb(var(--v-theme-background));
  border-color: rgba(var(--v-theme-on-surface), 0.18);
}

.assign-menu-item.selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.06);
}

.assign-menu-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.assign-menu-name {
  font-size: 13px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.assign-count {
  font-size: 11.5px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  padding: 2px 9px;
  border-radius: 20px;
}
</style>
