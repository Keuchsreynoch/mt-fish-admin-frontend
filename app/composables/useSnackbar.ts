import { sonnerToast } from "~/utils/sonnerToast";

type ToastType = "success" | "error" | "info" | "warning" | "expired" | "login" | "logout";

export function useSnackbar() {
  function showToast(title: string, message: string, type: ToastType) {
    sonnerToast(title, message, type);
  }

  function showSuccess(message: string, title = "Success") {
    sonnerToast(title, message, "success");
  }

  function showError(message: string, title = "Error") {
    sonnerToast(title, message, "error");
  }

  function showInfo(message: string, title = "Info") {
    sonnerToast(title, message, "info");
  }

  function showWarning(message: string, title = "Warning") {
    sonnerToast(title, message, "warning");
  }

  return {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
}
