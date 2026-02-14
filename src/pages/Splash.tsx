import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const PHRASES = [
  "ESCANEA. QUEMA. DOMINA.",
  "TU CUERPO ES TU TEMPLO.",
  "DÉFICIT INTELIGENTE, RESULTADOS BRUTALES.",
];

const Splash = () => {
  const navigate = useNavigate();
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => navigate("/login"), 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % PHRASES.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center"
      >
        <h1 className="font-display text-5xl tracking-wider text-primary text-glow-strong sm:text-7xl">
          JOSE DIAZ
        </h1>
        <h2 className="font-display text-3xl tracking-widest text-primary/80 sm:text-5xl">
          SCAN
        </h2>
      </motion.div>

      <motion.div
        className="mt-8 h-1 w-24 rounded-full gradient-gold box-glow"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      />

      <motion.p
        key={phraseIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="mt-6 font-display text-lg tracking-wider text-muted-foreground sm:text-xl"
      >
        {PHRASES[phraseIndex]}
      </motion.p>

      <motion.div
        className="mt-12 h-1 w-8 animate-pulse-glow rounded-full bg-primary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      />
    </div>
  );
};

export default Splash;
