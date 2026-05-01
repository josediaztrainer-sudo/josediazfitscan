// Centralized WhatsApp Premium link with personalized prefilled message.
const WA_BASE = "https://wa.me/message/M5LVYI64RN2GD1";

type PlanLabel = "Prueba gratuita" | "Premium activo" | "Prueba expirada" | "Sin plan";

export function planLabelFromStatus(status: string): PlanLabel {
  switch (status) {
    case "trial":
      return "Prueba gratuita";
    case "premium":
      return "Premium activo";
    case "expired":
      return "Prueba expirada";
    default:
      return "Sin plan";
  }
}

export function buildWhatsAppPremiumUrl(opts: {
  name?: string | null;
  status?: string;
  daysLeft?: number;
}): string {
  const name = (opts.name || "").trim();
  const greetingName = name ? name.split(" ")[0] : "";
  const plan = planLabelFromStatus(opts.status || "");

  const lines = [
    `Hola José${greetingName ? `, soy ${greetingName}` : ""}, quisiera activar mi plan Premium! 💪`,
    `• Plan actual: ${plan}`,
  ];

  if (opts.status === "trial" && typeof opts.daysLeft === "number") {
    lines.push(`• Días restantes de prueba: ${opts.daysLeft}`);
  }

  return `${WA_BASE}?text=${encodeURIComponent(lines.join("\n"))}`;
}
