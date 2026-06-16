import { useEffect, useState } from "react";
import { Palette, RotateCcw } from "lucide-react";
import { getAppearance, saveAppearance, applyAppearance, DEFAULT_APPEARANCE, type Appearance } from "@/lib/appearance";
import { toast } from "@/hooks/use-toast";

const ColorRow = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="flex items-center justify-between gap-3">
    <label className="text-sm text-foreground">{label}</label>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-9 rounded-md cursor-pointer bg-transparent border border-border"
      />
      <span className="text-xs font-mono text-muted-foreground w-16">{value}</span>
    </div>
  </div>
);

const AppearanceSettings = () => {
  const [open, setOpen] = useState(false);
  const [a, setA] = useState<Appearance>(getAppearance());

  // Live preview: apply on every change
  useEffect(() => {
    if (open) applyAppearance(a);
  }, [a, open]);

  // Initial mount: apply stored settings
  useEffect(() => {
    applyAppearance(getAppearance());
  }, []);

  const handleSave = () => {
    saveAppearance(a);
    toast({ title: "Saved", description: "Appearance updated." });
    setOpen(false);
  };

  const handleReset = () => {
    setA(DEFAULT_APPEARANCE);
    applyAppearance(DEFAULT_APPEARANCE);
  };

  const handleClose = () => {
    // Revert preview to saved state
    applyAppearance(getAppearance());
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => { setA(getAppearance()); setOpen(true); }}
        className="p-2 rounded-full bg-card/60 border border-border hover:bg-card transition"
        title="Appearance"
      >
        <Palette className="w-4 h-4 text-foreground" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <div className="glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xl font-display font-bold text-foreground">Appearance</h3>
              <button
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                title="Reset to defaults"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Live preview — changes apply instantly. Click Save to persist.
            </p>

            <div className="space-y-5">
              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Background colors</h4>
                <ColorRow label="Blob color 1" value={a.bgColor1} onChange={(v) => setA({ ...a, bgColor1: v })} />
                <ColorRow label="Blob color 2" value={a.bgColor2} onChange={(v) => setA({ ...a, bgColor2: v })} />
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-foreground">Intensity</label>
                    <span className="text-xs font-mono text-muted-foreground">{a.intensity}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={a.intensity}
                    onChange={(e) => setA({ ...a, intensity: Number(e.target.value) })}
                    className="w-full mt-2 accent-primary"
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Sidebar accent</h4>
                <ColorRow label="Accent color" value={a.accentColor} onChange={(v) => setA({ ...a, accentColor: v })} />
              </section>

              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Animations</h4>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-foreground">Background animation</span>
                  <input
                    type="checkbox"
                    checked={a.bgAnimation}
                    onChange={(e) => setA({ ...a, bgAnimation: e.target.checked })}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-foreground">Sidebar animation</span>
                  <input
                    type="checkbox"
                    checked={a.sidebarAnimation}
                    onChange={(e) => setA({ ...a, sidebarAnimation: e.target.checked })}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                </label>
              </section>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 rounded-full border border-border text-foreground text-sm hover:bg-muted/50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppearanceSettings;