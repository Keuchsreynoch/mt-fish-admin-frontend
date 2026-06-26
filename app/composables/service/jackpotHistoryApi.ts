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

export interface JackpotHistoryItem {
  id: number;
  jackpot_global_id: number;
  fish_type_id: number;
  fish_type_name: string;
  member_id: number;
  member_name?: string;
  bet_id: number;
  ticket_id: number;
  statement_id: number;
  source_type: string;
  jackpot_type?: number;
  jackpot_type_name?: string;
  payout_coin?: string;
  global_contribution_coin: string;
  pool_before: string;
  pool_after: string;
  created_at: string;
  created_by: number;
}

export interface JackpotHistoryData {
  histories: JackpotHistoryItem[];
}

export async function getJackpotHistories(
  page = 1,
  perPage = 20,
  startDate = "",
  endDate = "",
) {
  const url = buildUrlWithParams("/jackpot-history", {
    paging_options: {
      page,
      per_page: perPage,
    },
    ...(startDate && endDate
      ? {
          filters: [
            {
              property: "h.created_at",
              operator: "between",
              value: [startDate, endDate],
            },
          ],
      }
      : {}),
  });

  return useApiInterceptor<ApiResponse<JackpotHistoryData>>(
    url,
    { method: "GET" },
  );
}
