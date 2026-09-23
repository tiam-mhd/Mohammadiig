import { IsEnum } from 'class-validator';
import { OrderStatus } from '../order-status';
export class UpdateOrderStatusDto { @IsEnum(OrderStatus, { message: 'وضعیت سفارش نامعتبر است.' }) status!: OrderStatus; }
