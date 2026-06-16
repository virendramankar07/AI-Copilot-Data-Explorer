// Lightweight client-side AI client. The user can plug in any OpenAI-compatible
// endpoint + key (OpenAI, OpenRouter, Groq, local LM Studio, etc.) via the
// settings panel. The key is stored in localStorage only — never sent to our
// servers, never embedded in the bundle.

const STORAGE_KEY = "ai_copilot_settings_v1";

export interface AISettings {
  baseUrl: string;
  apiKey: string;
  model: string;
}

const DEFAULTS: AISettings = {
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4o-mini",
};

export function getAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveAISettings(s: AISettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function hasAIKey(): boolean {
  return !!getAISettings().apiKey;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  const { baseUrl, apiKey, model } = getAISettings();
  if (!apiKey) {
    throw new Error("No AI API key configured. Open Settings to add one.");
  }
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.3 }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI request failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

// Build a compact dataset summary the model can reason about without
// blowing the context window.
export function buildDatasetContext(
  data: Record<string, unknown>[],
  columns: string[],
): string {
  const head = data.slice(0, 5);
  const colSummaries = columns.slice(0, 30).map((col) => {
    const vals = data.map((r) => r[col]);
    const nums = vals.filter((v) => typeof v === "number") as number[];
    if (nums.length > vals.length / 2) {
      const sorted = [...nums].sort((a, b) => a - b);
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      return `${col} (numeric): mean=${mean.toFixed(2)}, min=${sorted[0]}, max=${sorted[sorted.length - 1]}, count=${nums.length}`;
    }
    const freq: Record<string, number> = {};
    vals.forEach((v) => {
      const k = String(v ?? "");
      freq[k] = (freq[k] || 0) + 1;
    });
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return `${col} (categorical): unique=${Object.keys(freq).length}, top=${top.map(([v, c]) => `${v}(${c})`).join(", ")}`;
  });
  return [
    `Dataset: ${data.length} rows × ${columns.length} columns.`,
    `Columns:\n${colSummaries.join("\n")}`,
    `First 5 rows (JSON): ${JSON.stringify(head)}`,
  ].join("\n\n");
}