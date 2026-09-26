import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Not, Repository } from "typeorm";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { Roles } from "./auth/roles.decorator";
import { RolesGuard } from "./auth/roles.guard";
import { UserEntity } from "./auth/user.entity";
import { CustomerEntity } from "./customers/customer.entity";
import { ProductEntity } from "./products/product.entity";
import { CategoryEntity } from "./products/category.entity";
import { QuotationEntity } from "./quotations/quotation.entity";
import { OrderEntity } from "./orders/order.entity";
import { InvoiceEntity } from "./invoices/invoice.entity";
import { PaymentEntity } from "./payments/payment.entity";

@ApiTags("dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
@Controller("dashboard")
export class DashboardController {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customers: Repository<CustomerEntity>,
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categories: Repository<CategoryEntity>,
    @InjectRepository(QuotationEntity)
    private readonly quotations: Repository<QuotationEntity>,
    @InjectRepository(OrderEntity)
    private readonly orders: Repository<OrderEntity>,
    @InjectRepository(InvoiceEntity)
    private readonly invoices: Repository<InvoiceEntity>,
    @InjectRepository(PaymentEntity)
    private readonly payments: Repository<PaymentEntity>,
  ) {}

  @Get("admin")
  @ApiOperation({ summary: "Live administrative dashboard metrics" })
  async metrics() {
    const [
      database,
      products,
      categories,
      customers,
      users,
      newRequests,
      pendingQuotations,
      activeOrders,
      pendingPayments,
      unpaidInvoices,
    ] = await Promise.all([
      this.dataSource
        .query("SELECT 1")
        .then(() => "ok")
        .catch(() => "error"),
      this.products.count({ where: { isActive: true } }),
      this.categories.count({ where: { isActive: true } }),
      this.customers.count(),
      this.users.count(),
      this.quotations.count({ where: { status: "draft" } }),
      this.quotations.count({ where: { status: "sent" } }),
      this.orders.count({ where: { status: Not("cancelled") } }),
      this.payments.count({ where: { paymentStatus: "pending" } }),
      this.invoices.count({ where: { paymentStatus: Not("paid") } }),
    ]);
    return {
      data: {
        products,
        categories,
        customers,
        users,
        newRequests,
        pendingQuotations,
        activeOrders,
        pendingPayments,
        unpaidInvoices,
        health: { backend: "ok", database },
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
