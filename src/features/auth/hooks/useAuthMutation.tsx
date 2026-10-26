import { useMutation } from '@tanstack/react-query';
import { changePin, login } from '../services/auth.service';

export const useLogin = () => {
  return useMutation({
    mutationFn: login,
  });
};

export const useChangePin = () => {
  return useMutation({
    mutationFn: changePin,
  });
};
