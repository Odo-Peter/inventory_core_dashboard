export interface LoginFormInterface {
  staff_code: string;
  pin: string;
}

interface Staff {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  role: string;
  store_id: string;
  must_change_pin: boolean;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  staff: Staff;
}

export interface AuthContextInterface {
  isLoading: boolean;
  logout: (navigate?: (path: string) => void) => Promise<void>;
}
