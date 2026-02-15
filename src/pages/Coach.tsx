import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Trash2, Loader2, Plus, MessageSquare, X, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import joseAvatar from "@/assets/jose-coach-avatar.jpeg";
import coachBg from "@/assets/coach-bg.jpg";

type Msg = { role: "user" | "assistant"; content: string; audioUrl?: string };
type Conversation = { id: string; title: string; created_at: string; updated_at: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coach-chat`;
const TRANSCRIBE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`;

const getWelcome = (sex?: string) => {
  const greeting = sex === "female" ? "campeona" : "campeón";
  return `¡Qué tal, ${greeting}! 🧡\n\nSoy **Jose Diaz**, tu coach personal. Pregúntame lo que necesites:\n• 🥩 Nutrición y macros\n• 🏋️ Rutinas de gym\n• 🔥 Estrategias para quemar grasa\n• 📊 Análisis de tu día\n\n¡Vamos con todo! ⚡`;
};

const Coach = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: getWelcome() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState<Record<string, any> | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch user profile context
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
          weight: p.weight_kg, age: p.age, sex: p.sex,
          targetCalories: p.target_calories, targetProtein: p.target_protein,
          targetCarbs: p.target_carbs, targetFat: p.target_fat,
          activityLevel: p.activity_level,
          consumedCalories: l?.total_calories || 0,
          protein: l?.total_protein || 0, carbs: l?.total_carbs || 0, fat: l?.total_fat || 0,
        };
        setUserContext(ctx);
        setMessages([{ role: "assistant", content: getWelcome(p.sex ?? undefined) }]);
      }
    };
    fetchContext();
  }, [user]);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    const { data } = await supabase
      .from("coach_conversations" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    setConversations((data as any[] || []) as Conversation[]);
    setLoadingHistory(false);
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadConversation = async (convId: string) => {
    const { data } = await supabase
      .from("coach_messages" as any)
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (data && (data as any[]).length > 0) {
      setMessages((data as any[]).map((m: any) => ({ role: m.role, content: m.content })));
      setActiveConvId(convId);
    }
    setShowHistory(false);
  };

  const saveMessage = async (convId: string, role: string, content: string) => {
    if (!user) return;
    await supabase.from("coach_messages" as any).insert({
      conversation_id: convId, user_id: user.id, role, content,
    } as any);
    await supabase.from("coach_conversations" as any)
      .update({ updated_at: new Date().toISOString() } as any)
      .eq("id", convId);
  };

  const createConversation = async (firstMsg: string): Promise<string> => {
    if (!user) return "";
    const title = firstMsg.slice(0, 60) + (firstMsg.length > 60 ? "..." : "");
    const { data, error } = await supabase
      .from("coach_conversations" as any)
      .insert({ user_id: user.id, title } as any)
      .select()
      .single();
    if (error || !data) return "";
    const convId = (data as any).id;
    setActiveConvId(convId);
    return convId;
  };

  const startNewChat = () => {
    setActiveConvId(null);
    setMessages([{ role: "assistant", content: getWelcome(userContext?.sex) }]);
    setShowHistory(false);
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("coach_conversations" as any).delete().eq("id", convId);
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConvId === convId) startNewChat();
  };

  // Audio recording with MediaRecorder
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        if (audioBlob.size < 1000) {
          toast.error("Audio muy corto. Intenta de nuevo.");
          return;
        }
        await handleAudioSend(audioBlob, mediaRecorder.mimeType);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      toast.info("🎙️ Grabando... Habla y presiona de nuevo para enviar", { duration: 2000 });
    } catch (err: any) {
      console.error("Mic error:", err);
      if (err.name === "NotAllowedError") {
        toast.error("Permiso de micrófono denegado. Habilítalo en la configuración.");
      } else {
        toast.error("No se pudo acceder al micrófono.");
      }
    }
  };

  const handleAudioSend = async (audioBlob: Blob, mimeType: string) => {
    // Create audio URL for playback in chat
    const audioUrl = URL.createObjectURL(audioBlob);
    const audioMsg: Msg = { role: "user", content: "🎙️ Mensaje de voz", audioUrl };
    const updatedMessages = [...messages, audioMsg];
    setMessages(updatedMessages);
    setLoading(true);

    // Convert to base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    try {
      // Step 1: Transcribe audio
      const transcribeResp = await fetch(TRANSCRIBE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ audioBase64: base64, mimeType }),
      });

      if (!transcribeResp.ok) {
        toast.error("No pude entender el audio. Intenta de nuevo.");
        setLoading(false);
        return;
      }

      const { transcription } = await transcribeResp.json();
      if (!transcription || transcription.trim().length === 0) {
        toast.error("No se detectó audio. Habla más fuerte o más cerca del micrófono.");
        setLoading(false);
        return;
      }

      // Save conversation
      let convId = activeConvId;
      if (!convId) convId = await createConversation(transcription);
      if (convId) await saveMessage(convId, "user", `🎙️ Audio: ${transcription}`);

      // Step 2: Send transcription to coach
      const chatMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: transcription },
      ];

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

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: chatMessages, userContext }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => null);
        toast.error(errData?.error || `Error ${resp.status}`);
        setLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No stream body");
      await processStream(resp.body, upsertAssistant);

      if (convId && assistantSoFar) {
        await saveMessage(convId, "assistant", assistantSoFar);
        loadConversations();
      }
    } catch (err: any) {
      console.error("Audio send error:", err);
      toast.error("Error procesando el audio");
    } finally {
      setLoading(false);
    }
  };

  const processStream = async (body: ReadableStream, onChunk: (chunk: string) => void) => {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";

    while (true) {
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
        if (jsonStr === "[DONE]") return;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onChunk(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Process remaining buffer
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
          if (content) onChunk(content);
        } catch { /* ignore */ }
      }
    }
  };

  const send = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Msg = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    let convId = activeConvId;
    if (!convId) convId = await createConversation(userMsg.content);
    if (convId) await saveMessage(convId, "user", userMsg.content);

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
      await processStream(resp.body, upsertAssistant);

      if (convId && assistantSoFar) {
        await saveMessage(convId, "assistant", assistantSoFar);
        loadConversations();
      }
    } catch (err: any) {
      console.error("Coach chat error:", err);
      toast.error("Error conectando con el coach IA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${coachBg})` }}
      />
      <div className="fixed inset-0 bg-background/70" />
      <div className="fixed inset-x-0 top-0 h-[30%] bg-gradient-to-b from-background/90 to-transparent" />

      <div className="relative z-10 flex h-full flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card/90 backdrop-blur-sm px-4 py-3">
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
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadConversations(); }}
                className="text-muted-foreground"
                title="Historial"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={startNewChat}
                className="text-muted-foreground"
                title="Nueva conversación"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* History sidebar overlay */}
        {showHistory && (
          <div className="absolute inset-0 z-50 flex">
            <div className="w-full max-w-xs border-r border-border bg-card flex flex-col">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="font-display text-sm tracking-wider text-primary">HISTORIAL</h3>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={startNewChat} className="h-7 w-7">
                    <Plus className="h-3.5 w-3.5 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)} className="h-7 w-7">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : conversations.length === 0 ? (
                  <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                    No hay conversaciones aún. ¡Empieza una!
                  </p>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={`flex cursor-pointer items-center justify-between border-b border-border px-4 py-3 transition-colors hover:bg-primary/5 ${
                        activeConvId === conv.id ? "bg-primary/10 border-l-2 border-l-primary" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground">{conv.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(conv.updated_at).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => deleteConversation(conv.id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="flex-1 bg-background/60" onClick={() => setShowHistory(false)} />
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-20">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card/90 backdrop-blur-sm text-foreground"
                }`}
              >
                {m.audioUrl ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-medium">Mensaje de voz</span>
                    </div>
                    <audio controls src={m.audioUrl} className="w-full max-w-[220px] h-8" />
                  </div>
                ) : m.role === "assistant" ? (
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
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card/90 backdrop-blur-sm px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Pensando... 🔥
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-border bg-card/90 backdrop-blur-sm p-3 mb-14 safe-bottom">
          <div className="mx-auto flex max-w-lg gap-2">
            <Button
              variant={isRecording ? "default" : "secondary"}
              size="icon"
              onClick={toggleRecording}
              disabled={loading}
              className={`shrink-0 ${isRecording ? "animate-pulse bg-red-600 hover:bg-red-700 border-red-500" : ""}`}
              title={isRecording ? "Detener y enviar audio" : "Enviar audio"}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={isRecording ? "🎙️ Grabando audio..." : "Pregúntale a tu coach..."}
              className="border-border bg-background text-foreground"
              disabled={loading || isRecording}
            />
            <Button onClick={send} disabled={loading || !input.trim() || isRecording} size="icon" className="box-glow shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Coach;
