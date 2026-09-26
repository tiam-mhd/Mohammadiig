import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Repository } from "typeorm";
import { UserEntity } from "../auth/user.entity";
import { CustomerEntity } from "./customer.entity";
import { assertCustomerAccess } from "./customer-status";

/** Repair missing legacy profiles without restoring accounts deleted by an administrator. */
export async function ensureCustomerProfile(
  customers: Repository<CustomerEntity>,
  user: UserEntity | null,
): Promise<CustomerEntity> {
  if (!user || user.deletedAt)
    throw new UnauthorizedException("حساب کاربری در دسترس نیست.");
  if (!user.isActive)
    throw new ForbiddenException(
      "حساب شما غیرفعال یا مسدود شده است. با پشتیبانی تماس بگیرید.",
    );
  let customer = await customers.findOne({
    where: { userId: user.id },
    withDeleted: true,
  });
  if (!customer) {
    // The unique user_id constraint and DO NOTHING make simultaneous first requests safe.
    await customers
      .createQueryBuilder()
      .insert()
      .values({
        id: randomUUID(),
        userId: user.id,
        companyName: user.companyName,
        phone: user.phone,
        contactPerson:
          [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
        isVerified: false,
      })
      .orIgnore()
      .execute();
    customer = await customers.findOne({
      where: { userId: user.id },
      withDeleted: true,
    });
  }
  if (!customer)
    throw new UnauthorizedException("پروفایل مشتری در دسترس نیست.");
  assertCustomerAccess(customer);
  return customer;
}
