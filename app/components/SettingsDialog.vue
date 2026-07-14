<template>
  <div>
    <v-dialog v-model="dialog" max-width="560">
      <v-card class="settings-dialog">
        <div class="settings-dialog__header">
          <div>
            <h2 class="settings-dialog__title">{{ t('common.settings') }}</h2>
            <!-- <p class="settings-dialog__subtitle">{{ t('settings.languageDescription') }}</p> -->
          </div>
          <v-btn icon variant="text" size="small" class="close-btn" @click="dialog = false">
            <v-icon size="18" style="font-weight: bold;">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-card-text class="settings-dialog__body">
          <section class="settings-panel">
            <div class="settings-panel__heading">
              <div class="settings-panel__icon">
                <v-icon size="18">mdi-lock-outline</v-icon>
              </div>
              <div>
                <h3 class="settings-panel__title">{{ t('profile.changePassword') }}</h3>
                <p class="settings-panel__hint">{{ t('settings.passwordDescription') }}</p>
              </div>
            </div>

            <div class="settings-grid">
              <div class="settings-field settings-field--full">
                <label class="settings-label">{{ t('profile.currentPassword') }}</label>
                <v-text-field v-model="passwordForm.currentPassword" :type="showCurrentPassword ? 'text' : 'password'"
                  density="compact" variant="outlined" hide-details="auto" :error-messages="errors.currentPassword"
                  :append-inner-icon="showCurrentPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showCurrentPassword = !showCurrentPassword" />
              </div>

              <div class="settings-field">
                <label class="settings-label">{{ t('profile.newPassword') }}</label>
                <v-text-field v-model="passwordForm.newPassword" :type="showNewPassword ? 'text' : 'password'"
                  density="compact" variant="outlined" hide-details="auto" :error-messages="errors.newPassword"
                  :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showNewPassword = !showNewPassword" />
              </div>

              <div class="settings-field">
                <label class="settings-label">{{ t('profile.confirmNewPassword') }}</label>
                <v-text-field v-model="passwordForm.confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
                  density="compact" variant="outlined" hide-details="auto" :error-messages="errors.confirmPassword"
                  :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showConfirmPassword = !showConfirmPassword" />
              </div>
            </div>

            <div class="settings-panel__actions">
              <v-btn color="primary" variant="flat" @click="submitPasswordChange" style="  text-transform: capitalize !important">
                {{ t('profile.savePassword') }}
              </v-btn>
            </div>
          </section>

          <section class="settings-panel">
            <div class="settings-panel__heading">
              <div class="settings-panel__icon">
                <v-icon size="18">mdi-translate</v-icon>
              </div>
              <div>
                <h3 class="settings-panel__title">{{ t('settings.languageTitle') }}</h3>
                <p class="settings-panel__hint">{{ t('settings.languageDescription') }}</p>
              </div>
            </div>

            <div class="lang-switcher">
              <button type="button" class="lang-switcher__btn"
                :class="{ 'lang-switcher__btn--active': locale === 'en' }" @click="setLocale('en')">
                {{ t('common.english') }}
              </button>
              <button type="button" class="lang-switcher__btn"
                :class="{ 'lang-switcher__btn--active': locale === 'km' }" @click="setLocale('km')">
                {{ t('common.khmer') }}
              </button>
            </div>
          </section>
        </v-card-text>

        <v-card-actions class="settings-dialog__actions">
          <v-btn variant="outlined" color="cancel" @click="dialog = false">
            {{ t('common.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useFrontendI18n } from '~/composables/i18n'
import { useSnackbar } from '~/composables/useSnackbar'

const model = defineModel<boolean>({ default: false })

const { locale, setLocale, t } = useFrontendI18n()
const { showWarning } = useSnackbar()

const dialog = computed({
  get: () => model.value,
  set: (value: boolean) => {
    model.value = value
  },
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const errors = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

function validatePasswordForm() {
  errors.currentPassword = passwordForm.currentPassword ? '' : t('profile.fieldRequired')
  errors.newPassword = ''
  errors.confirmPassword = ''

  if (!passwordForm.newPassword) {
    errors.newPassword = t('profile.fieldRequired')
  } else if (passwordForm.newPassword.length < 6) {
    errors.newPassword = t('profile.minLength')
  }

  if (!passwordForm.confirmPassword) {
    errors.confirmPassword = t('profile.fieldRequired')
  } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
    errors.confirmPassword = t('profile.passwordMismatch')
  }

  return !errors.currentPassword && !errors.newPassword && !errors.confirmPassword
}

function submitPasswordChange() {
  if (!validatePasswordForm()) {
    return
  }

  showWarning(t('settings.passwordUnavailable'), t('profile.changePassword'))
}
</script>

<style scoped>
.settings-dialog {
  overflow: hidden;
  border-radius: 18px !important;
}

.settings-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 20px 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.settings-dialog__title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: rgb(var(--v-theme-primary));
}

.settings-dialog__subtitle {
  margin: 6px 0 0;
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-size: 13px;
  line-height: 1.5;
}

.settings-dialog__body {
  display: grid;
  gap: 18px;
  padding: 16px 20px 20px;
}

.settings-panel {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px;
  padding: 16px;
  background: rgba(var(--v-theme-primary), 0.02);
}

.settings-panel__heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.settings-panel__icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}

.settings-panel__title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

.settings-panel__hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.56);
  line-height: 1.5;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.settings-field {
  min-width: 0;
}

.settings-field--full {
  grid-column: 1 / -1;
}

.settings-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.66);
  text-transform: capitalize;
  letter-spacing: 0.04em;
}

.settings-panel__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
  text-transform: capitalize !important;

}

/* Pill toggle language switcher */
.lang-switcher {
  display: inline-flex;
  gap: 6px;
  padding: 6px;
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.04);
}

.lang-switcher__btn {
  min-width: 96px;
  height: 34px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.lang-switcher__btn:hover:not(.lang-switcher__btn--active) {
  color: rgb(var(--v-theme-on-surface));
}

.lang-switcher__btn--active {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-secondary)));
  color: rgb(var(--v-theme-on-primary));
}

.settings-dialog__actions {
  padding: 0 20px 20px;
  justify-content: flex-end;
}

.close-btn :deep(.v-icon) {
  color: #FF2C2C !important;
}

@media (max-width: 640px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
