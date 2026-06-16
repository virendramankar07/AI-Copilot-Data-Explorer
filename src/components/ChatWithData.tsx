import { useRef, useState } from "react";
import { Send, Sparkles, Mic, MicOff, Bot, User } from "lucide-react";
import { chatCompletion, buildDatasetContext, hasAIKey, type ChatMessage } from "@/lib/aiClient";
import AISettings from "./AISettings";
import { toast } from "@/hooks/use-toast";

interface Props {
  data: Record<string, unknown>[];
  columns: string[];
}

const SUGGESTIONS = [
  "Top 5 insights batao",
  "Average of each numeric column?",
  "Outliers kaha hain?",
  "Which columns are most correlated?",
];

// Browser SpeechRecognition typing
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: { 0: { transcript: string } }[] }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: unknown) => void) | null;
  start: () => void;
  stop: () => void;
};

const getRecognition = (): SpeechRecognitionLike | null => {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
};

const ChatWithData = ({ data, columns }: Props) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    if (!hasAIKey()) {
      toast({
        title: "API key needed",
        description: "Open AI Settings (gear icon) to add an OpenAI-compatible key.",
        variant: "destructive",
      });
      return;
    }
    const next: ChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);

    try {
      const ctx = buildDatasetContext(data, columns);
      const reply = await chatCompletion([
        {
          role: "system",
          content: `You are a data analyst. Answer concisely about the user's dataset using the context below. If unsure, say so.\n\n${ctx}`,
        },
        ...next,
      ]);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      toast({ title: "AI error", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const toggleVoice = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = getRecognition();
    if (!rec) {
      toast({ title: "Not supported", description: "Voice input needs Chrome/Edge.", variant: "destructive" });
      return;
    }
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      send(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-display font-semibold text-foreground">Chat with your Dataset</h3>
        </div>
        <AISettings />
      </div>

      <div className="h-80 overflow-y-auto space-y-3 mb-3 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-10 h-10 text-accent mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Ask anything about your data.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted/60 text-foreground hover:bg-muted transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && <Bot className="w-5 h-5 text-accent shrink-0 mt-1" />}
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                  : "bg-muted/60 text-foreground"
              }`}
            >
              {m.content}
            </div>
            {m.role === "user" && <User className="w-5 h-5 text-primary shrink-0 mt-1" />}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Bot className="w-4 h-4 text-accent animate-pulse" /> Thinking…
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleVoice}
          className={`p-2.5 rounded-full border border-border ${listening ? "bg-destructive text-destructive-foreground" : "bg-muted/60 text-foreground"}`}
          title="Voice input"
        >
          {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about your data…"
          className="flex-1 px-4 py-2.5 rounded-full bg-muted/60 border border-border text-sm text-foreground"
        />
        <button
          onClick={() => send()}
          disabled={busy}
          className="p-2.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ChatWithData;