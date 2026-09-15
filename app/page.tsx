"use client";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Brain,
  ChevronRight,
  Flame,
  Home,
  Plus,
  Hash,
  Languages,
  MessageCircle,
  Sparkles,
  Target,
  Trophy,
  Users,
  Volume2,
  X,
} from "lucide-react";
import { concepts as seedConcepts, questions } from "@/data/curriculum";
import type { Attempt, Concept, Question } from "@/lib/types";
import {
  isIndonesianText,
  questionSpeechText,
  speakIndonesian,
} from "@/lib/speech";
import {
  gradeAnswer,
  scoreAttempt,
  selectAdaptiveQuestions,
  shuffleQuestionChoices,
  updateMastery,
} from "@/lib/learning";
type Tab = "home" | "know" | "materials" | "progress";
const nav = [
  ["home", Home, "Home"],
  ["know", Brain, "My Indonesian"],
  ["materials", BookOpen, "Materials"],
  ["progress", Trophy, "Progress"],
] as const;
export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [quiz, setQuiz] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [cs, setCs] = useState<Concept[]>(seedConcepts);
  const [xp, setXp] = useState(240);
  const [streak, setStreak] = useState(0);
  const [started, setStarted] = useState(0);
  const [name, setName] = useState("");
  const [practiceConceptIds, setPracticeConceptIds] = useState<string[] | null>(
    null,
  );
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const raw = localStorage.getItem("lancar-state");
    if (raw) {
      try {
        const s = JSON.parse(raw);
        setAttempts(s.attempts || []);
        const savedConcepts: Concept[] = s.concepts || [];
        const mergedSeeds = seedConcepts.map((seed) => {
          const saved = savedConcepts.find((concept) => concept.id === seed.id);
          return saved ? { ...seed, mastery: saved.mastery } : seed;
        });
        const manualConcepts = savedConcepts.filter(
          (saved) => !seedConcepts.some((seed) => seed.id === saved.id),
        );
        setCs([...mergedSeeds, ...manualConcepts]);
        setXp(s.xp || 240);
      } catch {}
    }
    setName(localStorage.getItem("lancar-name") || "");
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      "lancar-state",
      JSON.stringify({ attempts, concepts: cs, xp }),
    );
  }, [attempts, cs, xp, hydrated]);
  const approved = cs.filter((c) => c.status === "approved");
  const mastery = Math.round(
    approved.reduce((n, c) => n + c.mastery, 0) / approved.length,
  );
  function begin(conceptIds?: string[]) {
    const pool = conceptIds?.length
      ? approved.filter((concept) => conceptIds.includes(concept.id))
      : approved;
    setPracticeConceptIds(conceptIds || null);
    setQuiz(
      selectAdaptiveQuestions(questions, pool, attempts, 20).map((q) =>
        shuffleQuestionChoices(q),
      ),
    );
    setIndex(0);
    setSelected("");
    setResult(null);
    setStreak(0);
    setStarted(Date.now());
  }
  function answer(choice: string) {
    if (result !== null) return;
    const q = personalizeQuestion(quiz![index], name);
    const ok = gradeAnswer(choice, q.answers);
    const priorWrong = attempts
      .slice(-20)
      .some((a) => a.conceptId === q.conceptId && !a.correct);
    const next = ok ? streak + 1 : 0;
    const gained = scoreAttempt(ok, q.difficulty, ok && priorWrong, next);
    const attempt = {
      questionId: q.id,
      conceptId: q.conceptId,
      correct: ok,
      responseMs: Date.now() - started,
      at: new Date().toISOString(),
    };
    setSelected(choice);
    setResult(ok);
    setStreak(next);
    setXp((v) => v + gained);
    setAttempts((v) => [...v, attempt]);
    setCs((v) =>
      v.map((c) =>
        c.id === q.conceptId
          ? {
              ...c,
              mastery: updateMastery(c.mastery, ok, attempts, q.difficulty),
            }
          : c,
      ),
    );
  }
  function next() {
    if (index + 1 >= quiz!.length) {
      const pool = practiceConceptIds
        ? approved.filter((concept) =>
            practiceConceptIds.includes(concept.id),
          )
        : approved;
      const more = selectAdaptiveQuestions(questions, pool, attempts, 20);
      setQuiz((current) => [
        ...(current || []),
        ...more.map((q) => shuffleQuestionChoices(q)),
      ]);
    }
    setIndex((i) => i + 1);
    setSelected("");
    setResult(null);
    setStarted(Date.now());
  }
  if (!hydrated) return <main className="grain min-h-screen" />;
  if (!name) {
    return (
      <NameGate
        onSave={(value) => {
          localStorage.setItem("lancar-name", value);
          setName(value);
        }}
      />
    );
  }
  if (quiz) {
    const q = quiz[index];
    const c = cs.find((c) => c.id === q.conceptId)!;
    const namedQuestion = personalizeQuestion(q, name);
    return (
      <Quiz
        q={namedQuestion}
        concept={c}
        index={index}
        selected={selected}
        result={result}
        streak={streak}
        onAnswer={answer}
        onDraft={setSelected}
        onNext={next}
        onClose={() => setQuiz(null)}
      />
    );
  }
  return (
    <main className="grain min-h-screen">
      <div className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-7">
        {tab === "home" && (
          <HomeView
            mastery={mastery}
            xp={xp}
            concepts={approved}
            name={name}
            onStart={begin}
            onTab={setTab}
          />
        )}{" "}
        {tab === "know" && <Know concepts={cs} />}{" "}
        {tab === "materials" && <Materials onConcepts={setCs} />}{" "}
        {tab === "progress" && (
          <Progress attempts={attempts} concepts={approved} xp={xp} />
        )}
      </div>
      <nav className="safe fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md justify-around border-t border-ink/10 bg-cream/95 px-2 pt-3 backdrop-blur">
        {nav.map(([id, Icon, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex min-w-16 flex-col items-center gap-1 text-[11px] font-bold ${tab === id ? "text-teal" : "text-ink/45"}`}
          >
            <Icon size={21} />
            {label}
          </button>
        ))}
      </nav>
    </main>
  );
}
function personalizeQuestion(q: Question, name: string): Question {
  const replace = (value: string) => value.replaceAll("Pablo", name);
  return {
    ...q,
    prompt: replace(q.prompt),
    context: q.context ? replace(q.context) : undefined,
    choices: q.choices.map(replace),
    answers: q.answers.map(replace),
    explanation: replace(q.explanation),
  };
}
function greetingNow() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}
function dateNow() {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
    .format(new Date())
    .toLocaleUpperCase("id-ID");
}
function NameGate({ onSave }: { onSave: (name: string) => void }) {
  const [value, setValue] = useState("");
  const submit = () => {
    const clean = value.trim().slice(0, 30);
    if (clean) onSave(clean);
  };
  return (
    <main className="grain grid min-h-screen place-items-center px-5">
      <section className="card bali-border w-full max-w-sm rounded-[2rem] p-7 pt-9">
        <div className="sun-disc grid h-14 w-14 place-items-center rounded-full text-xl">ᬓ</div>
        <p className="mt-6 text-xs font-black tracking-[.2em] text-coral">SELAMAT DATANG</p>
        <h1 className="mt-2 text-3xl font-black">Siapa nama kamu?</h1>
        <p className="mt-2 text-sm text-ink/55">We’ll use your name to make practice feel personal.</p>
        <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Type your name" className="mt-6 w-full rounded-2xl border-2 border-ink/10 bg-white px-4 py-4 text-lg font-bold outline-none focus:border-teal" />
        <button type="button" onClick={submit} disabled={!value.trim()} className="mt-3 w-full touch-manipulation rounded-2xl bg-indigo py-4 font-black text-white disabled:opacity-35">MULAI BELAJAR</button>
      </section>
    </main>
  );
}
function HomeView({
  mastery,
  xp,
  concepts,
  name,
  onStart,
  onTab,
}: {
  mastery: number;
  xp: number;
  concepts: Concept[];
  name: string;
  onStart: (conceptIds?: string[]) => void;
  onTab: (t: Tab) => void;
}) {
  const weak = [...concepts].sort((a, b) => a.mastery - b.mastery).slice(0, 3);
  const practiceGroups = [
    {
      title: "Kata kerja",
      subtitle: "Verbs & actions",
      icon: Languages,
      ids: ["mau", "suka", "activity_verbs"],
      tone: "bg-coral/15 text-coral",
    },
    {
      title: "Angka",
      subtitle: "Numbers",
      icon: Hash,
      ids: ["number_spelling"],
      tone: "bg-lime/35 text-ink",
    },
    {
      title: "Kata ganti",
      subtitle: "I, you, we, they",
      icon: Users,
      ids: ["pronouns", "kami_vs_kita"],
      tone: "bg-teal/15 text-teal",
    },
    {
      title: "Percakapan",
      subtitle: "Conversation",
      icon: MessageCircle,
      ids: [
        "greetings_by_time",
        "farewells",
        "introductions",
        "question_forms",
        "availability_requests",
      ],
      tone: "bg-indigo/10 text-indigo",
    },
    {
      title: "Keluarga & orang",
      subtitle: "Family & people",
      icon: Users,
      ids: ["family_people", "jobs_roles", "pronouns"],
      tone: "bg-sand text-ink",
    },
  ];
  return (
    <>
      <header className="flex items-start justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="sun-disc grid h-9 w-9 place-items-center rounded-full text-base">
              ᬓ
            </div>
            <div>
              <p className="text-[10px] font-black tracking-[.24em] text-coral">
                LANCAR
              </p>
              <p className="text-[10px] font-bold tracking-wider text-ink/45">
                BAHASA SETIAP HARI
              </p>
            </div>
          </div>
          <p className="text-xs font-extrabold text-teal">{dateNow()}</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            {greetingNow()}, {name}.
          </h1>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-2 text-sm font-black shadow-sm">
          <Flame size={18} className="text-coral" />4
        </div>
      </header>
      <section className="bali-border relative mt-7 overflow-hidden rounded-[2rem] bg-indigo p-6 pt-8 text-white shadow-xl">
        <div className="sun-disc absolute -right-10 -top-10 h-36 w-36 opacity-30" />
        <div className="absolute bottom-0 right-5 text-[90px] leading-none text-white/[.035]">
          ᬒᬁ
        </div>
        <p className="text-xs font-black tracking-[.18em] text-lime">
          LATIHAN HARI INI
        </p>
        <h2 className="mt-3 max-w-[275px] text-3xl font-black leading-tight">
          Sedikit demi sedikit, jadi lancar.
        </h2>
        <p className="mt-3 text-sm text-white/65">
          Latihan adaptif tanpa batas · berhenti kapan saja
        </p>
        <button
          type="button"
          onClick={() => onStart()}
          className="mt-7 flex w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-lime py-4 text-lg font-black text-ink shadow-[0_6px_0_#bd8f31] active:translate-y-1 active:shadow-none"
        >
          <Sparkles size={21} />
          MULAI KUIS
        </button>
      </section>
      <section className="mt-7 grid grid-cols-2 gap-3">
        <Stat label="Penguasaan" value={`${mastery}%`} icon={<Target />} />
        <Stat label="Total XP" value={xp.toLocaleString()} icon={<Trophy />} />
      </section>
      <section className="mt-8">
        <p className="text-xs font-black tracking-widest text-coral">
          PILIH LATIHAN
        </p>
        <h2 className="mt-1 text-xl font-black">Latihan berdasarkan topik</h2>
        <p className="mt-1 text-sm text-ink/50">
          Focus on one area while questions stay varied.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {practiceGroups.map(({ title, subtitle, icon: Icon, ids, tone }) => (
            <button
              key={title}
              type="button"
              onClick={() => onStart(ids)}
              className="card touch-manipulation rounded-2xl p-4 text-left active:scale-[.98]"
            >
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
                <Icon size={20} />
              </div>
              <p className="mt-3 font-black">{title}</p>
              <p className="text-xs font-semibold text-ink/45">{subtitle}</p>
            </button>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-black tracking-widest text-coral">
              BERIKUTNYA
            </p>
            <h2 className="mt-1 text-xl font-black">Perlu dilatih lagi</h2>
          </div>
          <button
            onClick={() => onTab("know")}
            className="text-sm font-bold text-teal"
          >
            Lihat semua
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {weak.map((c, i) => (
            <div
              key={c.id}
              className="card flex items-center gap-4 rounded-2xl p-4"
            >
              <div
                className={`grid h-11 w-11 place-items-center rounded-xl font-black ${i === 0 ? "bg-coral/15 text-coral" : "bg-teal/10 text-teal"}`}
              >
                {c.mastery}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black">{c.title}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full bg-teal"
                    style={{ width: `${c.mastery}%` }}
                  />
                </div>
              </div>
              <ChevronRight size={20} className="text-ink/25" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="card rounded-2xl p-4">
      <div className="text-teal">{icon}</div>
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="text-xs font-bold text-ink/45">{label}</p>
    </div>
  );
}
function Quiz({
  q,
  concept,
  index,
  selected,
  result,
  streak,
  onAnswer,
  onDraft,
  onNext,
  onClose,
}: {
  q: Question;
  concept: Concept;
  index: number;
  selected: string;
  result: boolean | null;
  streak: number;
  onAnswer: (s: string) => void;
  onDraft: (s: string) => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const questionAudio = questionSpeechText(q);
  const answerAudio = isIndonesianText(q.answers[0]) ? q.answers[0] : "";
  return (
    <main className="grain min-h-screen">
      <div className="safe mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
        <header className="flex items-center gap-4">
          <button onClick={onClose} aria-label="Close quiz">
            <X />
          </button>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-teal transition-all"
              style={{ width: `${((index % 10) + 1) * 10}%` }}
            />
          </div>
          <b className="whitespace-nowrap">{index + 1} soal</b>
        </header>
        {streak >= 5 && (
          <div className="pop mx-auto mt-5 rounded-full bg-coral/15 px-4 py-2 text-sm font-black text-coral">
            🔥 {streak} correct in a row
          </div>
        )}
        <section className="flex flex-1 flex-col justify-center py-8">
          <span className="mb-4 w-fit rounded-full bg-teal/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-teal">
            {concept.title}
          </span>
          {q.context && (
          <p className="mb-4 whitespace-pre-line rounded-2xl bg-white p-4 text-sm font-bold leading-relaxed shadow-sm">
              {q.context}
            </p>
          )}
          <div className="flex items-start gap-3">
            <h1 className="min-w-0 flex-1 text-3xl font-black leading-tight">{q.prompt}</h1>
            {questionAudio && (
              <button
                type="button"
                onClick={() => speakIndonesian(questionAudio)}
                aria-label="Hear question in Indonesian"
                title="Dengarkan pertanyaan"
                className="grid h-12 w-12 shrink-0 touch-manipulation place-items-center rounded-full bg-lime text-ink shadow-sm active:scale-95"
              >
                <Volume2 size={23} />
              </button>
            )}
          </div>
          {q.type === "fill_blank" ? (
            <div className="mt-8 space-y-3">
              <input
                autoFocus
                value={selected}
                disabled={result !== null}
                onChange={(e) => onDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && selected.trim() && result === null)
                    onAnswer(selected);
                }}
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="Type your answer in Indonesian"
                className="w-full rounded-2xl border-2 border-ink/10 bg-white p-4 text-lg font-extrabold outline-none focus:border-teal"
              />
              <button
                type="button"
                disabled={!selected.trim() || result !== null}
                onClick={() => onAnswer(selected)}
                className="w-full touch-manipulation rounded-2xl bg-indigo py-4 font-black text-white disabled:opacity-35"
              >
                CHECK ANSWER
              </button>
            </div>
          ) : (
          <div className="mt-8 space-y-3">
            {q.choices.map((choice, i) => {
              const chosen = selected === choice;
              const correct = result !== null && gradeAnswer(choice, q.answers);
              return (
                <button
                  key={choice}
                  onClick={() => onAnswer(choice)}
                  className={`w-full rounded-2xl border-2 p-4 text-left font-extrabold transition active:scale-[.98] ${correct ? "border-teal bg-teal text-white" : chosen && result === false ? "border-coral bg-coral/10 text-coral" : "border-ink/10 bg-white"}`}
                >
                  <span className="mr-3 text-ink/35">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {choice}
                </button>
              );
            })}
          </div>
          )}
        </section>
        {result !== null && (
          <aside
            className={`-mx-5 -mb-6 rounded-t-[2rem] p-6 ${result ? "bg-teal text-white" : "bg-[#ffe4df] text-ink"}`}
          >
            <p className="text-xl font-black">
              {result ? "✓ Nice work!" : "Not quite — keep this one close."}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <p className="min-w-0 flex-1 font-black">
                {result ? "Answer" : "Correct answer"}: {q.answers[0]}
              </p>
              {answerAudio && (
                <button
                  type="button"
                  onClick={() => speakIndonesian(answerAudio)}
                  aria-label="Hear the correct answer in Indonesian"
                  title="Dengarkan jawaban"
                  className={`grid h-11 w-11 shrink-0 touch-manipulation place-items-center rounded-full ${result ? "bg-white text-teal" : "bg-coral text-white"}`}
                >
                  <Volume2 size={21} />
                </button>
              )}
            </div>
            <p
              className={`mt-2 text-sm font-semibold ${result ? "text-white/75" : "text-ink/65"}`}
            >
              {q.explanation}
            </p>
            <button
              onClick={onNext}
              className={`mt-5 w-full rounded-2xl py-4 font-black ${result ? "bg-white text-teal" : "bg-coral text-white"}`}
            >
              LANJUT
            </button>
          </aside>
        )}
      </div>
    </main>
  );
}
function Results({
  attempts,
  xp,
  onDone,
  onAgain,
}: {
  attempts: Attempt[];
  xp: number;
  onDone: () => void;
  onAgain: () => void;
}) {
  const correct = attempts.filter((a) => a.correct).length;
  return (
    <main className="grain min-h-screen">
      <div className="safe mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-8 text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-lime text-4xl">
          🎉
        </div>
        <p className="mt-6 text-sm font-black tracking-[.2em] text-teal">
          QUIZ COMPLETE
        </p>
        <h1 className="mt-2 text-4xl font-black">You kept it moving.</h1>
        <div className="card mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-ink/10">
          <div className="bg-white p-5">
            <b className="text-3xl">
              {correct}/{attempts.length}
            </b>
            <p className="text-xs font-bold text-ink/45">Correct</p>
          </div>
          <div className="bg-white p-5">
            <b className="text-3xl">
              {Math.round((correct / attempts.length) * 100)}%
            </b>
            <p className="text-xs font-bold text-ink/45">Accuracy</p>
          </div>
          <div className="bg-white p-5">
            <b className="text-3xl">+{correct * 15}</b>
            <p className="text-xs font-bold text-ink/45">XP earned</p>
          </div>
          <div className="bg-white p-5">
            <b className="text-3xl">{xp}</b>
            <p className="text-xs font-bold text-ink/45">Total XP</p>
          </div>
        </div>
        <button
          onClick={onAgain}
          className="mt-8 rounded-2xl bg-ink py-4 font-black text-white"
        >
          PRACTICE MY MISTAKES
        </button>
        <button onClick={onDone} className="mt-3 py-3 font-bold text-ink/55">
          Back home
        </button>
      </div>
    </main>
  );
}
function Know({ concepts }: { concepts: Concept[] }) {
  const groups = ["Grammar", "Vocabulary", "Conversation", "Phrases", "Numbers"];
  return (
    <>
      <p className="text-xs font-black tracking-widest text-teal">CURRICULUM</p>
      <h1 className="mt-1 text-3xl font-black">My Indonesian</h1>
      <p className="mt-2 text-ink/55">
        {concepts.filter((c) => c.status === "approved").length} approved
        concepts from your lessons.
      </p>
      <div className="mt-6 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-teal/10 p-3">
          <b>{concepts.filter((c) => c.mastery > 80).length}</b>
          <p className="text-[10px] font-bold">STRONG</p>
        </div>
        <div className="rounded-2xl bg-[#f4d35e]/25 p-3">
          <b>
            {concepts.filter((c) => c.mastery >= 31 && c.mastery <= 80).length}
          </b>
          <p className="text-[10px] font-bold">LEARNING</p>
        </div>
        <div className="rounded-2xl bg-coral/10 p-3">
          <b>{concepts.filter((c) => c.mastery < 31).length}</b>
          <p className="text-[10px] font-bold">PRACTICE</p>
        </div>
      </div>
      {groups.map((g) => (
        <section key={g} className="mt-7">
          <h2 className="text-lg font-black">{g}</h2>
          <div className="mt-2 space-y-2">
            {concepts
              .filter((c) => c.category === g)
              .map((c) => (
                <div key={c.id} className="card rounded-2xl p-4">
                  <div className="flex justify-between">
                    <b>{c.title}</b>
                    <span className="font-black text-teal">{c.mastery}%</span>
                  </div>
                  <p className="mt-1 text-xs text-ink/50">{c.sources[0]}</p>
                </div>
              ))}
          </div>
        </section>
      ))}
    </>
  );
}
function Materials({
  onConcepts,
}: {
  onConcepts: React.Dispatch<React.SetStateAction<Concept[]>>;
}) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [candidate, setCandidate] = useState<Concept | null>(null);
  function analyze() {
    const [word, meaning] = text.split(/=|:/).map((x) => x.trim());
    if (!word) return;
    setCandidate({
      id: word.toLowerCase().replace(/\W+/g, "_"),
      title: word,
      description: meaning || "Review this extracted meaning.",
      category: "Vocabulary",
      difficulty: 1,
      sources: ["Manual quick-add · 10 Sep 2026"],
      examples: [text],
      mastery: 15,
      status: "review",
    });
  }
  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-black tracking-widest text-teal">
            SOURCES
          </p>
          <h1 className="mt-1 text-3xl font-black">Learning materials</h1>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-white"
        >
          <Plus />
        </button>
      </div>
      <p className="mt-2 text-ink/55">
        Source material stays separate from what you approve for practice.
      </p>
      {adding && (
        <section className="card mt-6 rounded-3xl p-5">
          <h2 className="text-xl font-black">Add material</h2>
          <p className="mt-1 text-sm text-ink/50">
            Paste vocabulary or a phrase. PDF and photo uploads use this same
            review queue when Supabase is connected.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="kemarin = yesterday"
            className="mt-4 min-h-28 w-full rounded-2xl border border-ink/15 bg-cream p-4 outline-none"
          />
          <button
            onClick={analyze}
            className="mt-3 w-full rounded-2xl bg-ink py-3 font-black text-white"
          >
            ANALYZE
          </button>
          {candidate && (
            <div className="mt-4 rounded-2xl bg-lime/25 p-4">
              <p className="text-xs font-black text-teal">
                CANDIDATE · NEEDS APPROVAL
              </p>
              <input
                value={candidate.title}
                onChange={(e) =>
                  setCandidate({ ...candidate, title: e.target.value })
                }
                className="mt-2 w-full bg-transparent text-xl font-black outline-none"
              />
              <p className="mt-1 text-sm">{candidate.description}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setCandidate(null)}
                  className="flex-1 rounded-xl bg-white py-3 font-bold"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    onConcepts((v) => [
                      ...v,
                      { ...candidate, status: "approved" },
                    ]);
                    setCandidate(null);
                    setAdding(false);
                    setText("");
                  }}
                  className="flex-1 rounded-xl bg-teal py-3 font-bold text-white"
                >
                  Approve
                </button>
              </div>
            </div>
          )}
        </section>
      )}
      <div className="mt-7 space-y-3">
        <Material
          title="Lesson · 15 Sep 2026"
          meta="15 pages · family, work, time markers & activities"
          tone="bg-indigo/10"
        />
        <Material
          title="Lesson notes · 11 Sep 2026"
          meta="8 pages · 5 concepts added or reinforced"
          tone="bg-lime/30"
        />
        <Material
          title="Handwritten lesson notes"
          meta="23 pages · 13 concept groups"
          tone="bg-coral/10"
        />
        <Material
          title="Learning Book · Bab 2–3"
          meta="19 pages · greetings & introductions"
          tone="bg-teal/10"
        />
        <Material
          title="Initial import review"
          meta="1 item needs review"
          tone="bg-lime/30"
        />
      </div>
    </>
  );
}
function Material({
  title,
  meta,
  tone,
}: {
  title: string;
  meta: string;
  tone: string;
}) {
  return (
    <div className="card flex items-center gap-4 rounded-2xl p-4">
      <div className={`grid h-12 w-12 place-items-center rounded-xl ${tone}`}>
        <BookOpen />
      </div>
      <div className="flex-1">
        <b>{title}</b>
        <p className="text-xs text-ink/50">{meta}</p>
      </div>
      <ChevronRight className="text-ink/25" />
    </div>
  );
}
function Progress({
  attempts,
  concepts,
  xp,
}: {
  attempts: Attempt[];
  concepts: Concept[];
  xp: number;
}) {
  const accuracy = attempts.length
    ? Math.round(
        (attempts.filter((a) => a.correct).length / attempts.length) * 100,
      )
    : 0;
  const cats = useMemo(
    () =>
      ["Grammar", "Vocabulary", "Conversation", "Phrases", "Numbers"].map((name) => ({
        name,
        value: Math.round(
          concepts
            .filter((c) => c.category === name)
            .reduce((n, c) => n + c.mastery, 0) /
            Math.max(1, concepts.filter((c) => c.category === name).length),
        ),
      })),
    [concepts],
  );
  return (
    <>
      <p className="text-xs font-black tracking-widest text-teal">
        YOUR MOMENTUM
      </p>
      <h1 className="mt-1 text-3xl font-black">Progress</h1>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Stat
          label="Questions answered"
          value={attempts.length}
          icon={<Brain />}
        />
        <Stat label="Accuracy" value={`${accuracy}%`} icon={<Target />} />
        <Stat label="Total XP" value={xp} icon={<Trophy />} />
        <Stat label="Daily streak" value="4 days" icon={<Flame />} />
      </div>
      <h2 className="mt-8 text-xl font-black">Mastery by category</h2>
      <div className="card mt-3 space-y-5 rounded-3xl p-5">
        {cats.map((c) => (
          <div key={c.name}>
            <div className="flex justify-between text-sm font-black">
              <span>{c.name}</span>
              <span>{c.value}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full rounded-full bg-teal"
                style={{ width: `${c.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
