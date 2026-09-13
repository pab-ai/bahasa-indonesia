import type { Question } from "./types";

export function questionSpeechText(question: Question) {
  if (question.type === "fill_blank" && question.conceptId === "number_spelling") {
    return "Tulis angka yang ditampilkan dalam bahasa Indonesia.";
  }
  if (question.context) {
    const instruction =
      question.type === "dialogue"
        ? "Lengkapi percakapan dengan jawaban yang benar."
        : "Dengarkan percakapan, lalu pilih jawaban yang benar.";
    return `${question.context} ${instruction}`;
  }
  const quoted = question.prompt.match(/[“"]([^”"]+)[”"]/u)?.[1];
  if (quoted && /\b(saya|kamu|kami|kita|dia|mereka|selamat|apa|siapa|di|ke|dari|mau|suka|untuk)\b/i.test(quoted)) {
    return quoted;
  }
  if (question.prompt.includes("Complete:")) {
    return question.prompt.split("Complete:").at(-1)?.trim() || question.prompt;
  }
  return question.prompt;
}

export function speakIndonesian(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "id-ID";
  utterance.rate = 0.86;
  utterance.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const indonesianVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("id"));
  if (indonesianVoice) utterance.voice = indonesianVoice;
  window.speechSynthesis.speak(utterance);
  return true;
}
