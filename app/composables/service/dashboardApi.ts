import { useApiInterceptor } from "~/composables/api/useApiInterceptor";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  status_code: number;
  data: T;
}

export interface TopWinMember {
  member_id: number;
  member_uuid: string;
  username: string;
  total_bet_amount: string;
  total_payout_amount: string;
  total_win_amount: string;
  win_count: number;
}

export interface DashboardData {
  total_turnover: string;
  total_payout: string;
  total_company_profit: string;
  current_pool_jackpot: string;
  threshold_amount: string;
  reward_pool:  string;
  top_win_members: TopWinMember[];
}

export async function getDashboard() {
  return useApiInterceptor<ApiResponse<DashboardData>>("/dashboard", {
    method: "GET",
  });
}
