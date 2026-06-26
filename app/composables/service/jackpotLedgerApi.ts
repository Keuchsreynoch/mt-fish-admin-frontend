import { useApiInterceptor } from "~/composables/api/useApiInterceptor";
import { buildUrlWithParams } from "~/utils/url";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  status_code: number;
  data: T;
  page: number;
  per_page: number;
  total: number;
}

export interface JackpotLedgerItem {
  id: number;
  jackpot_global_id: number;
  fish_type_id: number;
  fish_type_name: string;
  member_id: number;
  bet_id: number;
  ticket_id: number;
  statement_id: number;
  source_type: string;
  global_contribution_coin: string;
  pool_before: string;
  pool_after: string;
  created_at: string;
  created_by: number;
}

export interface JackpotLedgerData {
  ledgers: JackpotLedgerItem[];
}

export async function getJackpotLedgers(
  page = 1,
  perPage = 20,
  startDate = "",
  endDate = "",
) {
  const url = buildUrlWithParams("/jackpot/ledger", {
    paging_options: {
      page,
      per_page: perPage,
    },
    ...(startDate && endDate
      ? {
          filters: [
            {
              property: "l.created_at",
              operator: "between",
              value: [startDate, endDate],
            },
          ],
        }
      : {}),
  });

  return useApiInterceptor<ApiResponse<JackpotLedgerData>>(
    url,
    { method: "GET" },
  );
}
