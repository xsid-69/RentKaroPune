export const WHATSAPP_NUMBER = "919021615130";

export function whatsappUrl(message = "Hi RentKaro Pune, I need help finding a rental home.") {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}