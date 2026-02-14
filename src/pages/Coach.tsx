import { useState } from "react";
import { Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Msg = { role: "user" | "assistant"; content: string };

const Coach = () => {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "¡Qué tal, campeón! 💪 Soy tu coach IA. Pregúntame sobre nutrición, macros, o dime qué comiste hoy y te doy feedback brutal. ¡La grasa no negocia, tú tampoco!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // TODO: connect to AI edge function
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "¡Buena pregunta, máquina! Conecta el backend para que pueda darte respuestas basadas en tu progreso real. 🔥" },
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display text-lg tracking-wide text-foreground">COACH IA</h2>
            <p className="text-xs text-muted-foreground">Tu entrenador nutricional</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
              Pensando...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Pregúntale a tu coach..."
            className="border-border bg-background text-foreground"
          />
          <Button onClick={send} disabled={loading || !input.trim()} size="icon" className="box-glow">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Coach;
