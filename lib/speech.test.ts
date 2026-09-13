import { describe, expect, it } from "vitest";
import { questions } from "../data/curriculum";
import { questionSpeechText } from "./speech";

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
});
