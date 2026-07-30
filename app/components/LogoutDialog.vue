<!-- components/LogoutDialog.vue -->
<template>
    <v-dialog v-model="model" max-width="360">
        <v-card class="logout-card" rounded="xl">
            <div class="logout-icon-wrap">
                <v-icon size="24" color="#fff">mdi-logout</v-icon>
            </div>

            <v-card-title class="logout-title">{{ t('logout.title') }}</v-card-title>
            <v-card-text class="logout-text">
                {{ t('logout.message') }}
            </v-card-text>

            <v-card-actions class="logout-actions">
                <AppButton variant="outlined" :label="t('common.cancel')" class="logout-btn" @click="model = false" />
                <AppButton action="logout" variant="flat" color="error" :label="t('logout.action')" class="logout-btn"
                    @click="confirmLogout" />
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { useFrontendI18n } from '~/composables/i18n'
import { useAuthStore } from '~/stores/authStore'
import AppButton from '~/components/Button.vue'

const model = defineModel<boolean>({ default: false })
const authStore = useAuthStore()
const { t } = useFrontendI18n()

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
    background: #FF2C2C;
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

.logout-btn {
    flex: 1;
}
</style>