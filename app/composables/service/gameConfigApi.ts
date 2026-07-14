import { useApiInterceptor } from "~/composables/api/useApiInterceptor";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  status_code: number;
  data: T;
}

export interface GameConfig {
  game_name: string;
  rtp_target: string;
  rtp_floor: string;
  rtp_ceiling: string;
  jackpot_rate: string;
  status_id: number;
  updated_at?: string | null;
  updated_by?: number | null;
  updated_by_username?: string;
}

export interface UpdateGameConfigResponse {
  id: number;
  jackpot_rate: string;
  rtp_target: string;
  rtp_floor: string;
  rtp_ceiling: string;
  status_id: number;
  updated_at: string;
  updated_by: number;
  updated_by_username: string;
}

export interface UpdateGameConfigBody {
  rtp_target: string;
  rtp_floor: string;
  rtp_ceiling: string;
  jackpot_rate: string;
  status_id: number;
}

export async function getGameConfig() {
  return useApiInterceptor<ApiResponse<GameConfig>>("/game-config", {
    method: "GET",
  });
}

export async function updateGameConfig(body: UpdateGameConfigBody) {
  return useApiInterceptor<ApiResponse<UpdateGameConfigResponse>>("/game-config", {
    method: "PUT",
    body,
  });
}
