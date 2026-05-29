// Single source of truth for the NOCTE business WhatsApp number.
// Any wa.me link, downsell CTA, or legal-page contact must reference these,
// never a hardcoded literal, so the number can never diverge across the app.

export const WHATSAPP_NUMBER = "595991893587";

export const WHATSAPP_DISPLAY = "+595 991 893587";

export const buildWhatsAppUrl = (message?: string): string =>
  message
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${WHATSAPP_NUMBER}`;
