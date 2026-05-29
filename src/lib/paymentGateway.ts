import type { QrisPayment } from '../services/subscriptionApi'

/** Pembayaran lewat halaman gateway (Xendit Invoice, dll.) — bukan QR statis di app */
export function hasGatewayCheckout(payment: Pick<QrisPayment, 'checkoutUrl'>): boolean {
  return Boolean(payment.checkoutUrl?.trim())
}
