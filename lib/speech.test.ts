import { describe, expect, it } from "vitest";
import { questions } from "../data/curriculum";
import { isIndonesianText, questionSpeechText } from "./speech";

describe("Indonesian speech prompts", () => {
  it("reads Indonesian dialogue context", () => {
    const question = questions.find((q) => q.id === "cloze-4")!;
    expect(questionSpeechText(question)).toContain("Kamu tinggal di mana");
  });

  it("does not speak the target number and reveal a typed answer", () => {
    const question = questions.find((q) => q.id === "number-spelling-10")!;
    expect(questionSpeechText(question)).not.toContain("22");
    expect(questionSpeechText(question)).not.toContain("dua puluh dua");
  });

  it("speaks only the Indonesian phrase inside an English prompt", () => {
    const question = questions.find((q) => q.prompt.includes("air putih"))!;
    expect(questionSpeechText(question)).toBe("air putih");
  });

  it("does not classify English answers as Indonesian", () => {
    expect(isIndonesianText("water")).toBe(false);
    expect(isIndonesianText("Movement toward")).toBe(false);
    expect(isIndonesianText("air putih")).toBe(true);
  });
});
