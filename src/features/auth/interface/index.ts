export interface LoginFormInterface {
  staff_code: string;
  pin: string;
}

export interface ChangePinInterface {
  current_pin: string;
  new_pin: string;
}

interface Staff {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  role: string;
  store_id: string;
  must_change_pin: boolean;
  staff_code?: string;
  store_name?: string;
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
  mustChangePin: boolean;
  setMustChangePin: (value: boolean) => void;
  requirePinChange: (staff?: Staff) => void;
  completePinChange: () => void;
}

export interface MyProfile {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  role: string;
  store_id: string;
  must_change_pin: boolean;
  active_shift_id: string | null;
  staff_code: string;
  store_name: string;
}
