import { useEffect, useState } from "react";
import { Settings2, Save, Eye, EyeOff } from "lucide-react";
import { getAISettings, saveAISettings, type AISettings as AIS } from "@/lib/aiClient";
import { toast } from "@/hooks/use-toast";

const AISettings = () => {
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [s, setS] = useState<AIS>(getAISettings());

  useEffect(() => {
    if (open) setS(getAISettings());
  }, [open]);

  const save = () => {
    saveAISettings(s);
    toast({ title: "Saved", description: "AI settings updated." });
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-full bg-card/60 border border-border hover:bg-card transition"
        title="AI Settings"
      >
        <Settings2 className="w-4 h-4 text-foreground" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="glass-card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-display font-bold text-foreground mb-1">AI Provider Settings</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Bring your own OpenAI-compatible key (OpenAI, OpenRouter, Groq, local LM Studio…). Stored locally only.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Base URL</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground"
                  value={s.baseUrl}
                  onChange={(e) => setS({ ...s, baseUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">API Key</label>
                <div className="relative mt-1">
                  <input
                    type={show ? "text" : "password"}
                    className="w-full px-3 py-2 pr-10 rounded-lg bg-muted/50 border border-border text-sm text-foreground"
                    value={s.apiKey}
                    onChange={(e) => setS({ ...s, apiKey: e.target.value })}
                    placeholder="sk-..."
                  />
                  <button
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Model</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground"
                  value={s.model}
                  onChange={(e) => setS({ ...s, model: e.target.value })}
                />
              </div>
            </div>
            <button
              onClick={save}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AISettings;