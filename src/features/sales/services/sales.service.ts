import axiosInstance from '@/lib/axiosInstance';

import type {
  CreateSalePayload,
  ListSalesQuery,
  ListSalesResponse,
  PaymentOptionsResponse,
  ReceiptResponse,
  Sale,
  SalesSummaryResponse,
} from '../types';

export const listSales = async (params: ListSalesQuery = {}): Promise<ListSalesResponse> => {
  const { data } = await axiosInstance.get<ListSalesResponse>('/sales', { params });
  return data;
};

export const getSale = async (id: string): Promise<Sale> => {
  const { data } = await axiosInstance.get<Sale>(`/sales/${id}`);
  return data;
};

export const createSale = async (payload: CreateSalePayload): Promise<Sale> => {
  const { data } = await axiosInstance.post<Sale>('/sales', payload);
  return data;
};

export const getPaymentOptions = async (): Promise<PaymentOptionsResponse> => {
  const { data } = await axiosInstance.get<PaymentOptionsResponse>('/sales/payment-options');
  return data;
};

export const getSalesSummary = async (
  params: ListSalesQuery = {},
): Promise<SalesSummaryResponse> => {
  const { data } = await axiosInstance.get<SalesSummaryResponse>('/sales/summary', { params });
  return data;
};

export const printSaleReceipt = async (id: string): Promise<ReceiptResponse> => {
  const { data } = await axiosInstance.post<ReceiptResponse>(`/sales/${id}/receipt-prints`);
  return data;
};
