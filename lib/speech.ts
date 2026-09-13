import type { Question } from "./types";

export function questionSpeechText(question: Question) {
  if (question.type === "fill_blank" && question.conceptId === "number_spelling") {
    return "Tulis angka yang ditampilkan dalam bahasa Indonesia.";
  }
  const quoted = question.prompt.match(/[“"]([^”"]+)[”"]/u)?.[1];
  if (quoted && isIndonesianText(quoted)) {
    return quoted;
  }
  if (question.prompt.includes("Complete:")) {
    const completion = question.prompt.split("Complete:").at(-1)?.trim() || "";
    return isIndonesianText(completion) ? completion : "";
  }
  if (question.context && isIndonesianText(question.context)) {
    return question.context;
  }
  return isIndonesianText(question.prompt) ? question.prompt : "";
}

const indonesianWords = new Set(
  "saya aku kamu kami kita kalian mereka dia selamat pagi siang sore malam sampai apa siapa mana dari di ke mau suka untuk siap ayo kenalkan ini itu baik terima kasih sama hati jalan tinggal pergi datang belajar makan minum pesan guru murid sekolah sekarang nanti tadi besok telur kopi teh roti nasi goreng yoghurt susu gula air putih sarapan restoran bahasa indonesia dan atau dengan tidak juga sedang rumah hotel kelas staf administrasi nol satu dua tiga empat lima enam tujuh delapan sembilan sepuluh sebelas belas puluh seratus".split(
    " ",
  ),
);

export function isIndonesianText(text: string) {
  return text
    .toLocaleLowerCase("id-ID")
    .split(/[^\p{L}]+/u)
    .some((word) => indonesianWords.has(word));
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
