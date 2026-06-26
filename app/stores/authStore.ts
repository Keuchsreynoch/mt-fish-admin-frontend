import { defineStore } from "pinia";
import { ref } from "vue";
import { useApiInterceptor } from "~/composables/api/useApiInterceptor";
import type { ApiResponse, MeResponseData } from "~/composables/service/adminManagementApi";
import type { LoginRequest, LoginResponse } from "~/types/login/login";
import { clearAccessToken, setAccessToken } from "~/utils/authToken";
import type { MenuItem, UserItem } from "~/composables/service/adminManagementApi";

const createEmptyLoginRequest = (): LoginRequest => ({
  user_name: "",
  password: "",
});

export const useAuthStore = defineStore("useAuthStore", () => {
  const authenticated = ref(false);
  const isSpinning = ref(false);
  const isProfileLoading = ref(false);
  const user = ref<LoginRequest>(createEmptyLoginRequest());
  const currentUser = ref<UserItem | null>(null);
  const menus = ref<MenuItem[]>([]);
  const profileLoaded = ref(false);

  const resetProfile = () => {
    currentUser.value = null;
    menus.value = [];
    profileLoaded.value = false;
  };

  const fetchMe = async (): Promise<void> => {
    if (profileLoaded.value && currentUser.value) {
      return;
    }

    isProfileLoading.value = true;

    try {
      const response = await useApiInterceptor<ApiResponse<MeResponseData>>("/me", {
        method: "GET",
      });
      const data = response?.data.value;

      if (data?.success) {
        currentUser.value = data.data.user;
        menus.value = data.data.menus ?? [];
        profileLoaded.value = true;
        return;
      }

      throw data ?? { message: "Unknown error" };
    } finally {
      isProfileLoading.value = false;
    }
  };

  const fetchLogin = async (): Promise<void> => {
    isSpinning.value = true;

    try {
      const response = await useApiInterceptor<LoginResponse>("/auth/login", {
        method: "POST",
        body: {
          user_name: user.value.user_name,
          password: user.value.password,
        },
      });

      const data = response?.data.value;

      if (data?.success) {
        setAccessToken(data.data.auth.token);
        try {
          await fetchMe();
        } catch (error) {
          clearAccessToken();
          authenticated.value = false;
          resetProfile();
          throw error;
        }
        authenticated.value = true;
        await navigateTo("/");
        return;
      }

      throw data ?? { message: "Unknown error" };
    } catch (error: unknown) {
      if (error && typeof error === "object") {
        if ("message" in error || "error" in error) {
          throw error;
        }
      }

      throw { message: "Unknown error" };
    } finally {
      isSpinning.value = false;
    }
  };

  const logout = (): void => {
    clearAccessToken();

    authenticated.value = false;
    user.value = createEmptyLoginRequest();
    resetProfile();

    navigateTo("/login");
  };

  return {
    authenticated,
    isSpinning,
    isProfileLoading,
    user,
    currentUser,
    menus,
    profileLoaded,
    fetchLogin,
    fetchMe,
    logout,
  };
});
