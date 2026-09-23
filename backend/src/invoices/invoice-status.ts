export enum InvoicePaymentStatus {
  Pending = 'pending',
  PartiallyPaid = 'partially_paid',
  Paid = 'paid',
  Overdue = 'overdue',
  Cancelled = 'cancelled',
}

export const invoicePaymentTransitions: Record<InvoicePaymentStatus, readonly InvoicePaymentStatus[]> = {
  [InvoicePaymentStatus.Pending]: [InvoicePaymentStatus.PartiallyPaid, InvoicePaymentStatus.Paid, InvoicePaymentStatus.Overdue, InvoicePaymentStatus.Cancelled],
  [InvoicePaymentStatus.PartiallyPaid]: [InvoicePaymentStatus.Paid, InvoicePaymentStatus.Overdue, InvoicePaymentStatus.Cancelled],
  [InvoicePaymentStatus.Overdue]: [InvoicePaymentStatus.PartiallyPaid, InvoicePaymentStatus.Paid, InvoicePaymentStatus.Cancelled],
  [InvoicePaymentStatus.Paid]: [],
  [InvoicePaymentStatus.Cancelled]: [],
};
