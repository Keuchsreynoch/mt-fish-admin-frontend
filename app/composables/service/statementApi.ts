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

export interface StatementItem {
  session_no: string;
  bet_no: string;
  fish_type_id: number;
  fish_type_name: string;
  ticket_no: string;
  bet_amount: string;
  bet_valid: string;
  bet_invalid: string;
  total_bet_amount: string;
  total_bet_invalid_amount: string;
  is_kill: boolean;
  win_lose: string;
  kill_reward: string;
  miss_reward: string;
  jackpot: string;
  total_win_lose: string;
  created_at: string;
}

export interface TotalReport {
  total_bet: string;
  total_valid_bet: string;
  total_winlose: string;
}

export interface StatementData {
  statements: StatementItem[];
  total_report: TotalReport;
}

export async function getStatements(
  page = 1,
  perPage = 10,
  createdAt = "",
  extraParams: Record<string, QueryValue> = {},
) {
  const url = buildUrlWithParams("/statements", {
    paging_options: {
      page,
      per_page: perPage,
    },
    ...(createdAt
      ? {
          filters: [
            {
              property: "s.created_at",
              value: createdAt,
              operator: "eq",
            },
          ],
        }
      : {}),
    ...extraParams,
  });

  return useApiInterceptor<ApiResponse<StatementData>>(
    url,
    { method: "GET" },
  );
}
