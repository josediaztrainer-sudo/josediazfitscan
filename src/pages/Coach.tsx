import { useState, useRef, useEffect } from "react";
import { Send, Bot, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import joseAvatar from "@/assets/jose-coach-avatar.jpeg";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coach-chat`;

const getWelcome = (sex?: string) => {
  const greeting = sex === "female" ? "campeona" : "campeón";
  return `¡Qué tal, ${greeting}! 🧡\n\nSoy **Jose Diaz**, tu coach personal de nutrición y entrenamiento. Estoy aquí para acompañarte en cada paso de tu transformación — con ciencia, dedicación y mucho corazón. 💪\n\nPuedes preguntarme sobre:\n• 🥩 Nutrición y macros personalizados\n• 🏋️ Rutinas de gym o casa\n• 🔥 Estrategias para quemar grasa\n• 📊 Análisis de lo que comiste hoy\n\n¡Vamos con todo, ${greeting}! Tu mejor versión te está esperando. ⚡`;
};

const Coach = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: getWelcome() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState<Record<string, any> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch user profile + today's log for context
  useEffect(() => {
    if (!user) return;
    const fetchContext = async () => {
      const today = new Date().toISOString().split("T")[0];

      const [profileRes, logRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("daily_logs").select("*").eq("user_id", user.id).eq("date", today).maybeSingle(),
      ]);

      const p = profileRes.data;
      const l = logRes.data;

      if (p) {
        const ctx = {
          weight: p.weight_kg,
          age: p.age,
          sex: p.sex,
          targetCalories: p.target_calories,
          targetProtein: p.target_protein,
          targetCarbs: p.target_carbs,
          targetFat: p.target_fat,
          activityLevel: p.activity_level,
          consumedCalories: l?.total_calories || 0,
          protein: l?.total_protein || 0,
          carbs: l?.total_carbs || 0,
          fat: l?.total_fat || 0,
        };
        setUserContext(ctx);
        // Update welcome message with gender
        setMessages([{ role: "assistant", content: getWelcome(p.sex ?? undefined) }]);
      }
    };
    fetchContext();
  }, [user]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    let assistantSoFar = "";

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length === updatedMessages.length + 1) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          userContext,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => null);
        toast.error(errData?.error || `Error ${resp.status}`);
        setLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No stream body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // flush remaining
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (err: any) {
      console.error("Coach chat error:", err);
      toast.error("Error conectando con el coach IA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 overflow-hidden rounded-full border border-primary">
              <img src={joseAvatar} alt="Jose Diaz Coach" className="h-full w-full object-cover object-top" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold tracking-wider text-foreground">JOSE DIAZ COACH</h2>
              <p className="text-xs text-muted-foreground">
                {userContext
                  ? `${userContext.consumedCalories}/${userContext.targetCalories} kcal hoy · En línea`
                  : "Tu coach personal · En línea 🟢"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMessages([messages[0]])}
            className="text-muted-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-foreground"
              }`}
            >
              {m.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_li]:my-0.5 [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_table]:my-2 [&_th]:bg-primary/20 [&_th]:text-primary [&_th]:px-2 [&_th]:py-1 [&_th]:border [&_th]:border-border [&_th]:text-left [&_th]:font-display [&_th]:tracking-wide [&_td]:px-2 [&_td]:py-1 [&_td]:border [&_td]:border-border [&_td]:text-foreground [&_tr:nth-child(even)]:bg-card/50 [&_hr]:border-primary/20 [&_hr]:my-3 [&_h3]:text-primary [&_h3]:font-display [&_h3]:tracking-wider [&_h3]:text-base [&_h3]:mt-4 [&_h3]:mb-2 [&_strong]:text-primary [&_img]:rounded-lg [&_img]:my-2 [&_img]:max-h-40 [&_img]:object-cover [&_img]:border [&_img]:border-border">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Pensando... 🔥
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 border-t border-border bg-card p-3 safe-bottom">
        <div className="mx-auto flex max-w-lg gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Pregúntale a tu coach..."
            className="border-border bg-background text-foreground"
            disabled={loading}
          />
          <Button onClick={send} disabled={loading || !input.trim()} size="icon" className="box-glow shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Coach;
