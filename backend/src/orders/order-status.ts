export enum OrderStatus { Pending='pending', Confirmed='confirmed', Processing='processing', ReadyForDelivery='ready_for_delivery', Delivered='delivered', Cancelled='cancelled' }
export const orderStatusTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.Pending]: [OrderStatus.Confirmed, OrderStatus.Cancelled],
  [OrderStatus.Confirmed]: [OrderStatus.Processing, OrderStatus.Cancelled],
  [OrderStatus.Processing]: [OrderStatus.ReadyForDelivery, OrderStatus.Cancelled],
  [OrderStatus.ReadyForDelivery]: [OrderStatus.Delivered, OrderStatus.Cancelled],
  [OrderStatus.Delivered]: [], [OrderStatus.Cancelled]: [],
};
