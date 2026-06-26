import { useApiInterceptor } from "~/composables/api/useApiInterceptor";
import { buildUrlWithParams, type QueryValue } from "~/utils/url";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  status_code: number;
  data: T;
  page: number;
  per_page: number;
  total: number;
}

export interface FishTypeItem {
  fish_type_name: string;
  is_boss: boolean;
  boss_name: string | null;
  min_kill_odd: number | null;
  max_kill_odd: number | null;
  base_speed: number;
  miss_reward_enabled: boolean;
  min_miss_reward_odd: number | null;
  max_miss_reward_odd: number | null;
}

export interface FishTypeData {
  fish_types: FishTypeItem[];
}

export async function getFishTypes(
  page = 1,
  perPage = 50,
  extraParams: Record<string, QueryValue> = {},
) {
  const url = buildUrlWithParams("/fish-type", {
    paging_options: {
      page,
      per_page: perPage,
    },
    ...extraParams,
  });

  return useApiInterceptor<ApiResponse<FishTypeData>>(
    url,
    { method: "GET" },
  );
}