import { isNative } from "./native";

/** Ship target is Android APK: voice notes use @capacitor-community/speech-recognition on device; browser Web Speech is dev-only fallback. */

type SpeechPlugin = {
  available(): Promise<{ available: boolean }>;
  start(options: { language?: string; maxResults?: number; prompt?: string }): Promise<{ matches?: string[] }>;
  stop(): Promise<void>;
  requestPermissions(): Promise<{ speechRecognition?: string }>;
};

let speechPlugin: SpeechPlugin | null = null;

async function getSpeechPlugin(): Promise<SpeechPlugin | null> {
  if (!isNative) return null;
  if (speechPlugin) return speechPlugin;
  try {
    const mod = await import("@capacitor-community/speech-recognition");
    speechPlugin = mod.SpeechRecognition as unknown as SpeechPlugin;
    return speechPlugin;
  } catch {
    return null;
  }
}

function webSpeechAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { webkitSpeechRecognition?: new () => WebSpeechRecognition };
  return Boolean(w.webkitSpeechRecognition || (window as unknown as { SpeechRecognition?: new () => WebSpeechRecognition }).SpeechRecognition);
}

type WebSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export async function startVoiceToText(onPartial: (text: string) => void, onError: (msg: string) => void): Promise<() => void> {
  const plugin = await getSpeechPlugin();
  if (plugin) {
    try {
      await plugin.requestPermissions();
      const { available } = await plugin.available();
      if (!available) {
        onError("Speech recognition not available on this device.");
        return () => {};
      }
      const result = await plugin.start({ language: "en-GB", maxResults: 1, prompt: "Speak your note" });
      const text = result.matches?.[0]?.trim() ?? "";
      if (text) onPartial(text);
      return () => {
        void plugin.stop();
      };
    } catch {
      onError("Could not start voice input.");
      return () => {};
    }
  }

  if (!webSpeechAvailable()) {
    onError("Voice input needs the Android app or a browser with speech support.");
    return () => {};
  }

  const Ctor =
    (window as unknown as { SpeechRecognition?: new () => WebSpeechRecognition }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition: new () => WebSpeechRecognition }).webkitSpeechRecognition;
  const rec = new Ctor();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = "en-GB";
  let final = "";
  rec.onresult = (ev) => {
    let chunk = "";
    for (let i = ev.results.length - 1; i >= 0; i--) {
      chunk = ev.results[i]?.[0]?.transcript ?? "";
      if (chunk) break;
    }
    final = chunk;
    onPartial(final);
  };
  rec.onerror = (ev) => onError(ev.error || "Speech error");
  rec.start();
  return () => rec.stop();
}
