import axiosInstance from '@/lib/axiosInstance';
import type {
  AdjustStockPayload,
  DamageStockPayload,
  InitialStockPayload,
  ListMovementsQuery,
  MovementListResponse,
  ReceiveStockPayload,
  ReconciliationListResponse,
  RecordMovementInput,
  StockMovementRecord,
  StockStatus,
} from '../types';

export const listStockMovements = async (
  params: ListMovementsQuery,
): Promise<MovementListResponse> => {
  const { reason, ...rest } = params;

  const { data } = await axiosInstance.get<MovementListResponse>('/inventory/movements', {
    // The API expects reason=a,b rather than reason[]=a&reason[]=b
    params: { ...rest, ...(reason?.length ? { reason: reason.join(',') } : {}) },
  });

  return data;
};

export const getStockStatus = async (itemId: string): Promise<StockStatus> => {
  const { data } = await axiosInstance.get<StockStatus>(`/inventory/items/${itemId}/stock-status`);

  return data;
};

export const listReconciliation = async (params: {
  page: number;
  page_size: number;
}): Promise<ReconciliationListResponse> => {
  const { data } = await axiosInstance.get<ReconciliationListResponse>(
    '/inventory/reconciliation',
    { params },
  );

  return data;
};

const postMovement = async <TBody>(
  itemId: string,
  action: RecordMovementInput['action'],
  body: TBody,
): Promise<StockMovementRecord> => {
  const { data } = await axiosInstance.post<StockMovementRecord>(
    `/inventory/items/${itemId}/${action}`,
    body,
  );

  return data;
};

export const initializeStock = (itemId: string, body: InitialStockPayload) =>
  postMovement(itemId, 'initial', body);

export const receiveStock = (itemId: string, body: ReceiveStockPayload) =>
  postMovement(itemId, 'receive', body);

export const adjustStock = (itemId: string, body: AdjustStockPayload) =>
  postMovement(itemId, 'adjust', body);

export const recordDamage = (itemId: string, body: DamageStockPayload) =>
  postMovement(itemId, 'damage', body);

/** Dispatches to the right endpoint; the union keeps action and body in sync. */
export const recordMovement = (input: RecordMovementInput): Promise<StockMovementRecord> => {
  switch (input.action) {
    case 'initial':
      return initializeStock(input.itemId, input.body);
    case 'receive':
      return receiveStock(input.itemId, input.body);
    case 'adjust':
      return adjustStock(input.itemId, input.body);
    case 'damage':
      return recordDamage(input.itemId, input.body);
  }
};
