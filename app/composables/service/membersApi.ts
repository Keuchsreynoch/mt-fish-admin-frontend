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

export interface MemberBalanceItem {
  currency_id: number;
  currency_name: string;
  currency_code: string;
  currency_symbol: string;
  balance: string;
}

export interface MemberItem {
  id: number;
  user_uuid: string;
  user_name: string;
  login_id: string;
  phone_number: string;
  profile_photo: string | null;
  language_id: number | null;
  currency_id: number | null;
  coin_amount: string | null;
  balances: MemberBalanceItem[];
  remark: string | null;
  nickname: string | null;
  login_session: string | null;
  last_login_at: string | null;
  is_online: boolean;
  is_active: boolean;
  status_id: number;
  timezone: string | null;
  pattern: string | null;
  order: number | null;
  created_by: number | null;
  created_at: string;
  updated_by: number | null;
  updated_at: string | null;
}

export interface MemberData {
  members: MemberItem[];
}

export interface UpdateJackpotStatusData {
  member_id: number;
  is_active: boolean;
  updated_at: string;
  updated_by: number;
}

export async function getMembers(options: {
  filters?: QueryFilter[];
  sorts?: QuerySort[];
  paging?: PagingOption;
}) {
  const params = buildQueryParams(options) as Record<string, QueryValue>
  return useApiInterceptor<ApiResponse<MemberData>>(
    buildUrlWithParams(`/members`, params),
    { method: "GET" },
  );
}

export async function updateMemberJackpotStatus(memberId: number, isActive: boolean) {
  return useApiInterceptor<ApiResponse<UpdateJackpotStatusData>>(
    `/members/${memberId}/jackpot-status`,
    {
      method: "PATCH",
      body: { is_active: isActive },
    },
  );
}