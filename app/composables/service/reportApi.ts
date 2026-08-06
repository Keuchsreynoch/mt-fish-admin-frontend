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

export interface ReportItem {
  member_id: number;
  member_uuid: string;
  member_name: string;
  total_bet_amount: string;
  total_valid_bet: string;
  total_win_lose: string;
  jackpot_win_amount: string;
  jackpot_member_bonus_amount: string;
}

export interface ReportData {
  reports: ReportItem[];
  total_report?: ReportTotal;
}

export interface ReportTotal {
  total_bet: string;
  total_valid_bet: string;
  total_winlose: string;
}

export async function getReports(
  page = 1,
  perPage = 10,
  startDate = "",
  endDate = "",
  extraParams: Record<string, QueryValue> = {},
) {
  const url = buildUrlWithParams("/reports", {
    paging_options: {
      page,
      per_page: perPage,
    },
    ...(startDate && endDate
      ? {
          filters: [
            {
              property: "s.created_at",
              operator: "between",
              value: [startDate, endDate],
            },
          ],
        }
      : {}),
    ...extraParams,
  });

  return useApiInterceptor<ApiResponse<ReportData>>(
    url,
    { method: "GET" },
  );
}

export interface TotalPayoutItem {
  member_id: number;
  member_uuid: string;
  member_name: string;
  total_payout_amount: string;
}

export interface TotalPayoutData {
  payouts: TotalPayoutItem[];
  total: number;
}

export async function getTotalPayout(
  page = 1,
  perPage = 10,
  startDate = "",
  endDate = "",
  memberName = "",
  extraParams: Record<string, QueryValue> = {},
) {
  const filters: QueryValue[] = [];

  if (startDate && endDate) {
    filters.push({
      property: "created_at",
      operator: "between",
      value: [startDate, endDate],
    });
  }

  if (memberName) {
    filters.push({
      property: "member_name",
      operator: "ilike",
      value: `%${memberName}%`,
    });
  }

  const url = buildUrlWithParams("/reports/payout", {
    paging_options: {
      page,
      per_page: perPage,
    },
    ...(filters.length ? { filters } : {}),
    ...extraParams,
  });

  return useApiInterceptor<ApiResponse<TotalPayoutData>>(url, { method: "GET" });
}