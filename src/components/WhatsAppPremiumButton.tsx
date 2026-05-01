import { motion } from "framer-motion";

const WHATSAPP_URL = "https://wa.me/message/M5LVYI64RN2GD1";

const WhatsAppPremiumButton = () => {
  return (
    <motion.a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.97 }}
      className="mb-4 flex w-full items-center justify-center gap-3 rounded-lg px-4 py-3 font-display text-lg tracking-wider text-white shadow-lg transition-all hover:brightness-110"
      style={{
        background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
        boxShadow: "0 8px 24px -8px rgba(37, 211, 102, 0.6)",
      }}
      aria-label="Adquirir Premium por WhatsApp"
    >
      {/* WhatsApp official icon */}
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="currentColor" aria-hidden="true">
        <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.49-.97-2.79-.21-.26-.55-.27-.91-.27-.41 0-.51.04-.81.27-.45.34-1.39.99-1.39 2.55 0 1.32.81 2.51 1.43 3.31 1.86 2.39 4.18 4.27 7.07 5.14.49.15 1.03.27 1.55.27.74 0 1.55-.45 1.96-1.04.21-.31.43-.85.43-1.29 0-.13-.04-.27-.13-.36-.31-.31-2.45-1.06-2.66-1.06zM16.05 5.18c-5.97 0-10.83 4.86-10.83 10.83 0 2.16.64 4.25 1.83 6.04L5.04 27.18l5.27-1.7a10.78 10.78 0 0 0 5.74 1.65c5.97 0 10.83-4.86 10.83-10.83S22.02 5.18 16.05 5.18zm0 19.8c-1.78 0-3.52-.51-5.02-1.46l-.36-.22-3.74 1.21 1.22-3.65-.24-.38a8.96 8.96 0 0 1-1.51-4.94c0-4.95 4.03-8.97 8.97-8.97 4.94 0 8.97 4.02 8.97 8.97-.01 4.95-4.03 8.97-8.97 8.97z" />
      </svg>
      <span>PREMIUM POR WHATSAPP</span>
    </motion.a>
  );
};

export default WhatsAppPremiumButton;
