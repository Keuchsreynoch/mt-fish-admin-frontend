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

export interface MemberBonusItem {
  id: number;
  member_id: number;
  amount: string;
  note: string;
  order: number;
  status_id: number;
  created_at: string;
  created_by: number;
}

export interface MemberBonusData {
  bonuses: MemberBonusItem[];
}

export interface CreateMemberBonusBody {
  amount: string;
  member_id: number;
  note: string;
}

export async function getMemberBonuses(
  page = 1,
  perPage = 10,
  dateFrom = "",
  dateTo = "",
  extraParams: Record<string, QueryValue> = {},
) {
  const url = buildUrlWithParams("/jackpot/member-bonuses", {
    paging_options: { page, per_page: perPage },
    ...(dateFrom && dateTo
      ? {
          filters: [
            {
              property: "created_at",
              operator: "between",
              value: [dateFrom, dateTo],
            },
          ],
        }
      : {}),
    ...extraParams,
  });

  return useApiInterceptor<ApiResponse<MemberBonusData>>(url, { method: "GET" });
}

export async function createMemberBonus(body: CreateMemberBonusBody) {
  return useApiInterceptor<ApiResponse<MemberBonusItem>>(
    "/jackpot/member-bonuses",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}