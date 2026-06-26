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

export interface JackpotCurrent {
  id: number;
  current_amount: string;
  threshold_amount: string;
  chance_denom: number;
  payout_percent: string;
  min_eligible_bet_amount: string;
  company_topup_amount: string;
  jackpot_fixed_payout_amount: string;
  status_id: number;
  order: number;
  created_at: string;
  created_by: number;
  updated_at: string | null;
  updated_by: number;
}

export interface CreateJackpotCompanyTopupBody {
  amount: string;
  note: string;
}

export interface JackpotCompanyTopupItem {
  id: number;
  username: string;
  jackpot_global_id: number;
  amount: string;
  current_amount_before: string;
  current_amount_after: string;
  note: string;
  order: number;
  created_at: string;
  created_by: number;
}

export interface JackpotCompanyTopupData {
  topups: JackpotCompanyTopupItem[];
}

export interface UpdateJackpotCurrentBody {
  threshold_amount: string;
  chance_denom: number;
  payout_percent: string;
  min_eligible_bet_amount: string;
  jackpot_fixed_payout_amount: string;
}

export async function getJackpotCurrent() {
  return useApiInterceptor<ApiResponse<JackpotCurrent>>(
    "/jackpot/current",
    { method: "GET" },
  );
}

export async function createJackpotCompanyTopup(body: CreateJackpotCompanyTopupBody) {
  return useApiInterceptor<ApiResponse<JackpotCompanyTopupItem>>(
    "/jackpot/company-topups",
    {
      method: "POST",
      body,
    },
  );
}

export async function getJackpotCompanyTopups(
  page = 1,
  perPage = 10,
  dateFrom = "",
  dateTo = "",
  extraParams: Record<string, QueryValue> = {},
) {
  const url = buildUrlWithParams("/jackpot/company-topups", {
    paging_options: {
      page,
      per_page: perPage,
    },
    ...(dateFrom && dateTo
      ? {
          filters: [
            {
              property: "t.created_at",
              operator: "between",
              value: [dateFrom, dateTo],
            },
          ],
        }
      : {}),
    ...extraParams,
  });

  return useApiInterceptor<ApiResponse<JackpotCompanyTopupData>>(url, { method: "GET" });
}

export async function updateJackpotCurrent(body: UpdateJackpotCurrentBody) {
  return useApiInterceptor<ApiResponse<JackpotCurrent>>(
    "/jackpot/current",
    {
      method: "PUT",
      body,
    },
  );
}
