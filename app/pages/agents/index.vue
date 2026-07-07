<template>
  <div class="coin-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Users</h1>
      </div>
    </div>

    <div class="content-wepper">
      <div class="toolbar">
        <!-- <v-text-field
          v-model="userSearch"
          placeholder="ឈ្មោះអ្នកប្រើប្រាស់"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          variant="outlined"
          hide-details
          class="search-field"
          clearable
        /> -->

        <!-- <v-btn class="btn-primary" prepend-icon="mdi-plus" @click="openCreateUserDialog">
          Add User
        </v-btn> -->

        <v-btn color="success" variant="flat" prepend-icon="mdi-plus" class="refresh-btn"  @click="openCreateUserDialog">
          <!-- <v-icon size="16" class="mr-1">mdi-refresh</v-icon> -->
          Add User
        </v-btn>
      </div>

      <AppTable :columns="userColumns" :items="filteredUsers" :loading="userLoading" :error="userError" :page="userPage"
        :page-size="userPageSize" :total-pages="userTotalPages" @update:page="userPage = $event">
        <template #cell-username="{ item }">
          <div class="user-cell">
            <div class="avatar">{{ getInitials(item.username) }}</div>
            <div>
              <div class="user-name">{{ item.username }}</div>
              <div class="user-email">{{ item.email }}</div>
            </div>
          </div>
        </template>

        <template #cell-role="{ item }">
          <span class="role-badge">{{ item.role }}</span>
        </template>

        <template #cell-actions="{ item }">
          <v-btn size="small" variant="outlined" prepend-icon="mdi-key-variant" @click="openAssignDialog(item)">
            Assign Menus
          </v-btn>
        </template>
      </AppTable>
    </div>

    <!-- CREATE USER -->
    <v-dialog v-model="createUserDialog" max-width="560">
      <v-card class="dialog-card">
        <div class="dialog-header">
          <div class="dialog-title-row">
            <v-icon size="20" color="#1F2937">mdi-account-plus-outline</v-icon>
            <h2>Create New User</h2>
          </div>

          <v-btn icon size="small" variant="text" @click="createUserDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <v-divider />

        <div class="dialog-body">
          <div class="form-grid">
            <div class="form-group half">
              <label class="form-label">Username <span class="required">*</span></label>
              <v-text-field v-model="userForm.user_name" placeholder="e.g. ADMIN006" density="compact"
                variant="outlined" hide-details="auto" />
            </div>

            <div class="form-group half">
              <label class="form-label">Login ID <span class="required">*</span></label>
              <v-text-field v-model="userForm.login_id" placeholder="e.g. ADMIN006" density="compact" variant="outlined"
                hide-details="auto" />
            </div>

            <div class="form-group half">
              <label class="form-label">Password <span class="required">*</span></label>
              <v-text-field v-model="userForm.password" :type="showPassword ? 'text' : 'password'" placeholder="••••••"
                density="compact" variant="outlined" hide-details="auto"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword" />
            </div>

            <div class="form-group half">
              <label class="form-label">Email <span class="required">*</span></label>
              <v-text-field v-model="userForm.email" placeholder="e.g. admin@example.com" density="compact"
                variant="outlined" hide-details="auto" />
            </div>

            <div class="form-group half">
              <label class="form-label">Nickname</label>
              <v-text-field v-model="userForm.nickname" placeholder="e.g. noch" density="compact" variant="outlined"
                hide-details />
            </div>

            <div class="form-group half">
              <label class="form-label">Profile</label>
              <v-text-field v-model="userForm.profile" placeholder="e.g. admin" density="compact" variant="outlined"
                hide-details />
            </div>

            <div class="form-group full">
              <label class="form-label">Assign Menus</label>

              <div class="assign-menu-grid" style="max-height: 220px;">
                <div v-for="menu in allMenus" :key="menu.id" class="assign-menu-item"
                  :class="{ selected: isCreateMenuSelected(menu.id) }" @click="toggleUserMenu(menu.id)">
                  <div class="assign-menu-left">
                    <v-icon size="18" :color="isCreateMenuSelected(menu.id) ? '#1F2937' : '#9CA3AF'">
                      {{ menu.icon }}
                    </v-icon>

                    <span class="assign-menu-name">{{ menu.name }}</span>
                  </div>

                  <v-icon size="18" :color="isCreateMenuSelected(menu.id) ? '#1F2937' : '#D1D5DB'">
                    {{ isCreateMenuSelected(menu.id) ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline' }}
                  </v-icon>
                </div>
              </div>

              <!-- <div class="assign-count" style="margin-top: 6px">
                {{ userForm.menu_ids.length }} menu(s) selected
              </div> -->
            </div>
          </div>
        </div>

        <v-divider />

        <div class="dialog-actions">
          <v-btn variant="outlined" @click="createUserDialog = false">Cancel</v-btn>

          <v-btn class="btn-primary" :loading="createUserLoading" @click="submitCreateUser">
            Create User
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- ASSIGN USER MENUS -->
    <v-dialog v-model="assignDialog" max-width="560">
      <v-card class="dialog-card">
        <div class="dialog-header">
          <div class="dialog-title-row">
            <v-icon size="20" color="#1F2937">mdi-key-variant</v-icon>
            <div>
              <h2>Assign Menus</h2>
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
            <v-progress-circular indeterminate color="#1F2937" size="28" />
            <span>Loading user menus...</span>
          </div>

          <div v-else class="assign-menu-grid">
            <div v-for="menu in allMenus" :key="menu.id" class="assign-menu-item"
              :class="{ selected: isMenuAssigned(menu.id) }" @click="toggleMenu(menu.id)">
              <div class="assign-menu-left">
                <v-icon size="18" :color="isMenuAssigned(menu.id) ? '#1F2937' : '#9CA3AF'">
                  {{ menu.icon }}
                </v-icon>

                <span class="assign-menu-name">{{ menu.name }}</span>
                <!-- <span class="path-pill small">{{ menu.path }}</span> -->
              </div>

              <v-icon size="18" :color="isMenuAssigned(menu.id) ? '#1F2937' : '#D1D5DB'">
                {{ isMenuAssigned(menu.id) ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline' }}
              </v-icon>
            </div>
          </div>
        </div>

        <v-divider />

        <div class="dialog-actions">
          <!-- <span class="assign-count">{{ assignedMenuIds.length }} menu(s) selected</span> -->

          <v-btn variant="outlined" @click="assignDialog = false">Cancel</v-btn>

          <v-btn class="btn-primary" :loading="assignSaving" @click="submitAssign">
            Save Assignment
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppTable from '@/components/AppTable.vue'
import type { TableColumn } from '@/components/DynamicTableStyle.vue'
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

const userColumns: TableColumn<User>[] = [
  { key: 'id', label: '#', type: 'index', width: '48px' },
  { key: 'username', label: 'User', align: 'left' },
  { key: 'role', label: 'Role', width: '120px' },
  { key: 'actions', label: 'Actions', width: '160px' },
]

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
    userError.value = e?.message ?? 'Failed to load users'
  }
  finally {
    userLoading.value = false
  }
}

function getInitials(name: string) {
  return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '??'
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
  const { user_name, login_id, password, email } = userForm.value

  if (!user_name || !login_id || !password || !email) {
    showError('Please fill in all required fields')
    return
  }

  createUserLoading.value = true

  try {
    await createUser(userForm.value)

    showSuccess(`User ${user_name} created successfully`)
    createUserDialog.value = false

    await fetchUsers()
  }
  catch (e: any) {
    showError(e?.message ?? 'Failed to create user')
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

    showSuccess(`Menus assigned to ${selectedUser.value.username}`)
    assignDialog.value = false
  }
  catch (e: any) {
    showError(e?.message ?? 'Assignment failed')
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
.coin-page {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
}

.page-title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: #111827;
  margin: 0;
}

.header-chips {
  display: flex;
  align-items: center;
  gap: 12px;
}

.content-wepper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-primary {
  background: #1F2937 !important;
  color: #fff !important;
  font-weight: 600;
  letter-spacing: 0;
  border-radius: 8px !important;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.search-field {
  max-width: 280px;
}

.path-pill {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  background: #F3F4F6;
  color: #4B5563;
  border: 1px solid rgba(31, 41, 55, 0.1);
  border-radius: 5px;
  padding: 2px 8px;
  white-space: nowrap;
}

.path-pill.small {
  font-size: 10px;
  padding: 1px 6px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #E5E7EB;
  color: #374151;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.user-email {
  font-size: 11px;
  color: #9CA3AF;
}

.role-badge {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  background: rgba(31, 41, 55, 0.07);
  color: #374151;
  padding: 3px 10px;
  border-radius: 20px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px;
  color: #6B7280;
  font-size: 14px;
}

.dialog-card {
  border-radius: 12px !important;
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
  gap: 10px;
}

.dialog-title-row h2 {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.dialog-subtitle {
  font-size: 12px;
  color: #9CA3AF;
  margin: 2px 0 0;
}

.dialog-body {
  padding: 20px;
}

.dialog-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
}

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
  color: #374151;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.required {
  color: #EF4444;
}

/* ✅ 2-column grid for menu list */
.assign-menu-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  overflow-y: auto;
}

.assign-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid rgba(31, 41, 55, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.assign-menu-item:hover {
  background: #F9FAFB;
}

.assign-menu-item.selected {
  border-color: #1F2937;
  background: rgba(31, 41, 55, 0.04);
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
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.assign-count {
  font-size: 12px;
  color: #6B7280;
  margin-right: auto;
}
</style>
