import { useApiInterceptor } from "~/composables/api/useApiInterceptor";
import { buildUrlWithParams } from "~/utils/url";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  status_code: number;
  data: T;
  page?: number;
  per_page?: number;
  total?: number;
}

export const ReservedJackpotStatus = {
  Active: 1,
  Inactive: 2,
  Claimed: 3,
} as const;

export interface ReservedJackpot {
  id: number;
  member_id: number;
  member_name: string;
  amount: string;
  order?: number;
  status_id: number;
  created_at?: string;
}

export interface ReserveJackpotPayload {
  member_name: string;
  amount: string;
}

export interface ReservedJackpotListData {
  reserved_jackpots: ReservedJackpot[];
}

export interface GetReservedJackpotsFilter {
  property: string;
  operator: string;
  value: [string, string] | string;
}

export interface GetReservedJackpotsParams {
  paging_options?: {
    page?: number;
    per_page?: number;
  };
  filters?: GetReservedJackpotsFilter[];
}

const BASE_URL = "/jackpot/reserved-jackpots";

// POST /jackpot/reserved-jackpots
export async function createReservedJackpot(payload: ReserveJackpotPayload) {
  return useApiInterceptor<ApiResponse<ReservedJackpot>>(BASE_URL, {
    method: "POST",
    body: payload,
  });
}

// GET /jackpot/reserved-jackpots
export async function getReservedJackpots(
  page = 1,
  perPage = 10,
  startDate = "",
  endDate = "",
  extraParams: Record<string, QueryValue> = {},
) {
  const url = buildUrlWithParams("/jackpot/reserved-jackpots", {
    paging_options: {
      page,
      per_page: perPage,
    },
    ...(startDate && endDate
      ? {
          filters: [
            {
              property: "created_at",
              operator: "between",
              value: [startDate, endDate],
            },
          ],
        }
      : {}),
    ...extraParams,
  });

  return useApiInterceptor<ApiResponse<ReservedJackpotListData>>(
    url,
    { method: "GET" },
  );
}

// PATCH /jackpot/reserved-jackpots/{id}/inactive
export async function inactiveReservedJackpot(id: number) {
  return useApiInterceptor<ApiResponse<ReservedJackpot>>(
    `${BASE_URL}/${id}/inactive`,
    { method: "PATCH" },
  );
}

// PATCH /jackpot/reserved-jackpots/{id}/reactivate
export async function reactivateReservedJackpot(id: number) {
  return useApiInterceptor<ApiResponse<ReservedJackpot>>(
    `${BASE_URL}/${id}/reactivate`,
    { method: "PATCH" },
  );
}