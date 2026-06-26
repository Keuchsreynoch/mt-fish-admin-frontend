import { useApiInterceptor } from "~/composables/api/useApiInterceptor";
import { buildUrlWithParams } from "~/utils/url";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  status_code: number;
  data: T;
}

export interface MenuItem {
  id: number;
  menu_uuid: string;
  name: string;
  icon: string;
  path: string;
  parent_id: number;
  status_id: number;
  order: number;
  created_by: number;
  created_at: string;
  updated_by: number;
  updated_at: string;
}

export interface UserItem {
  id: number;
  user_uuid: string;
  user_name: string;
  login_id: string;
  email: string;
  nickname: string;
  profile: string;
  role_id: number;
  role_name: string;
  is_admin: boolean;
  login_session: string;
  status_id: number;
  order: number;
  created_by: number;
  created_at: string;
  updated_by: number;
  updated_at: string;
}

export interface MenusResponseData {
  menus: MenuItem[];
}

export interface UsersResponseData {
  users: UserItem[];
}

export interface MeResponseData {
  user: UserItem;
  menus: MenuItem[];
}

export interface CreateUserPayload {
  user_name: string;
  login_id: string;
  password: string;
  email: string;
  nickname: string;
  profile: string;
  menu_ids: number[];
}

export interface MenuPayload {
  name: string;
  icon: string;
  path: string;
  order: number;
  parent_id: number;
  status_id: number;
}

export async function getMenus() {
  return useApiInterceptor<ApiResponse<MenusResponseData>>(
    buildUrlWithParams("/menus"),
    { method: "GET" },
  );
}

export async function getMyMenus() {
  return useApiInterceptor<ApiResponse<MenusResponseData>>(
    buildUrlWithParams("/me/menus"),
    { method: "GET" },
  );
}

export async function getMe() {
  return useApiInterceptor<ApiResponse<MeResponseData>>(
    buildUrlWithParams("/me"),
    { method: "GET" },
  );
}

export async function getUsers() {
  return useApiInterceptor<ApiResponse<UsersResponseData>>(
    buildUrlWithParams("/users"),
    { method: "GET" },
  );
}

export async function getUserMenus(userId: number) {
  return useApiInterceptor<ApiResponse<MenusResponseData>>(
    buildUrlWithParams(`/users/${userId}/menus`),
    { method: "GET" },
  );
}

export async function assignUserMenus(userId: number, menuIds: number[]) {
  return useApiInterceptor<ApiResponse<MenusResponseData>>(
    buildUrlWithParams(`/users/${userId}/menus`),
    {
      method: "PUT",
      body: {
        menu_ids: menuIds,
      },
    },
  );
}

export async function createUser(payload: CreateUserPayload) {
  return useApiInterceptor<ApiResponse<{ user: UserItem; menus: MenuItem[] }>>(
    buildUrlWithParams("/users"),
    {
      method: "POST",
      body: payload,
    },
  );
}

export async function updateMenu(menuId: number, payload: MenuPayload) {
  return useApiInterceptor<ApiResponse<{ menu: MenuItem }>>(
    buildUrlWithParams(`/menus/${menuId}`),
    {
      method: "PUT",
      body: payload,
    },
  );
}
