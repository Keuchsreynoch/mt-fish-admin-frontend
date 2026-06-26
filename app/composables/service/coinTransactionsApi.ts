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

export interface CoinTransactionItem {
  member_uuid: string;
  username: string;
  member_coin_id: number;
  before_coin: string;
  amount: string;
  transaction_type_id: number;
  transaction_group_type_id: number;
  transaction_date: string;
  require_approval: boolean;
  reference: string;
  remark: string;
  status_id: number;
  order: number;
  created_at: string;
}

export interface CoinTransactionData {
  transactions: CoinTransactionItem[];
}

export async function getCoinTransactions(
  page = 1,
  perPage = 20,
  startDate = "",
  endDate = "",
) {
  const url = buildUrlWithParams("/coin-transactions", {
    paging_options: {
      page,
      per_page: perPage,
    },
    ...(startDate && endDate
      ? {
          filters: [
            {
              property: "ct.created_at",
              operator: "between",
              value: [startDate, endDate],
            },
          ],
        }
      : {}),
  });

  return useApiInterceptor<ApiResponse<CoinTransactionData>>(url, {
    method: "GET",
  });
}
