<template>
    <v-dialog v-model="model" max-width="360" >
        <v-card class="logout-card" rounded="xl">
            <div class="logout-icon-wrap">
                <v-icon size="24" color="#D97706">mdi-logout</v-icon>
            </div>

            <v-card-title class="logout-title">Log out</v-card-title>
            <v-card-text class="logout-text">
                You'll need to sign in again to access your account.
            </v-card-text>

            <v-card-actions class="logout-actions">
                <v-btn variant="outlined" rounded="lg" class="logout-btn-cancel" @click="model = false">
                    Cancel
                </v-btn>
                <v-btn variant="flat" rounded="lg" class="logout-btn-confirm" @click="confirmLogout">
                    Log out
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'

const model = defineModel<boolean>({ default: false })
const authStore = useAuthStore()

function confirmLogout() {
    model.value = false
    authStore.logout()
}
</script>

<style scoped>
.logout-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 28px 24px;
    background: #FFFFFF;
    gap: 0;
}

.logout-icon-wrap {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #FEF3C7;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
}

.logout-title {
    padding: 0 0 8px;
    font-size: 17px;
    font-weight: 500;
    color: #1F2937;
    text-align: center;
}

.logout-text {
    padding: 0 0 28px;
    font-size: 13px;
    color: rgba(31, 41, 55, 0.55);
    text-align: center;
    line-height: 1.6;
}

.logout-actions {
    padding: 0;
    gap: 8px;
    width: 100%;
}

.logout-btn-cancel {
    flex: 1;
    color: rgba(31, 41, 55, 0.6) !important;
    border-color: rgba(31, 41, 55, 0.15) !important;
}

.logout-btn-confirm {
    flex: 1;
    background: #D97706 !important;
    color: #FFFFFF !important;
}
</style>