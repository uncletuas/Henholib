import { useEffect, useState, type CSSProperties } from "react";
import { Plus, Trash2, ClipboardCheck } from "lucide-react";
import { colors, gradientBrand } from "../../lib/brand";
import type { EditableExam, ExamQuestion, QuestionKind } from "../../config/academy";

const input: CSSProperties = { width: "100%", padding: "9px 11px", borderRadius: "9px", border: `1px solid ${colors.hairline}`, background: "#fff", fontSize: "13.5px", color: colors.heading, outline: "none" };
const btn: CSSProperties = { background: gradientBrand, color: "#fff", padding: "9px 16px", borderRadius: "999px", fontSize: "13.5px", fontWeight: 600, border: "none", cursor: "pointer" };
const ghost: CSSProperties = { background: colors.surfaceMuted, color: colors.heading, padding: "7px 12px", borderRadius: "999px", fontSize: "12.5px", fontWeight: 600, border: "none", cursor: "pointer" };

const oid = () => Math.random().toString(36).slice(2, 8);
type Q = Required<Pick<ExamQuestion, "prompt" | "kind" | "options" | "points">> & { correct: string[] };
const blankQ = (): Q => ({ prompt: "", kind: "single", options: [{ id: oid(), text: "" }, { id: oid(), text: "" }], correct: [], points: 1 });
const tfOptions = () => [{ id: "true", text: "True" }, { id: "false", text: "False" }];

interface Api {
  getExam: (token: string, courseId: string) => Promise<{ exam: EditableExam | null }>;
  saveExam: (token: string, exam: { courseId: string; title: string; passMark: number; published: boolean; questions: ExamQuestion[] }) => Promise<{ ok: boolean; examId: string }>;
}

export function ExamEditor({ token, courseId, api }: { token: string; courseId: string; api: Api }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Course assessment");
  const [passMark, setPassMark] = useState(70);
  const [published, setPublished] = useState(false);
  const [questions, setQuestions] = useState<Q[]>([blankQ()]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api.getExam(token, courseId).then((r) => {
      if (r.exam) {
        setTitle(r.exam.title); setPassMark(r.exam.passMark); setPublished(r.exam.published);
        setQuestions(r.exam.questions.length ? r.exam.questions.map((q) => ({ prompt: q.prompt, kind: q.kind, options: q.options, points: q.points, correct: q.correct || [] })) : [blankQ()]);
      }
    }).catch(() => {});
  }, [token, courseId, api]);

  const upd = (i: number, patch: Partial<Q>) => setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const setKind = (i: number, kind: QuestionKind) => upd(i, kind === "truefalse" ? { kind, options: tfOptions(), correct: [] } : { kind, options: questions[i].kind === "truefalse" ? [{ id: oid(), text: "" }, { id: oid(), text: "" }] : questions[i].options, correct: [] });
  const toggleCorrect = (i: number, optId: string) => {
    const q = questions[i];
    if (q.kind === "multi") { const s = new Set(q.correct); s.has(optId) ? s.delete(optId) : s.add(optId); upd(i, { correct: [...s] }); }
    else upd(i, { correct: [optId] });
  };
  const setOpt = (i: number, optId: string, text: string) => upd(i, { options: questions[i].options.map((o) => (o.id === optId ? { ...o, text } : o)) });
  const addOpt = (i: number) => upd(i, { options: [...questions[i].options, { id: oid(), text: "" }] });
  const rmOpt = (i: number, optId: string) => upd(i, { options: questions[i].options.filter((o) => o.id !== optId), correct: questions[i].correct.filter((c) => c !== optId) });

  const save = async () => {
    setBusy(true); setMsg(null);
    const clean = questions
      .map((q) => ({ ...q, prompt: q.prompt.trim(), options: q.options.filter((o) => q.kind === "truefalse" || o.text.trim()) }))
      .filter((q) => q.prompt && q.correct.length > 0 && q.options.length >= 2);
    if (clean.length === 0) { setBusy(false); setMsg({ ok: false, text: "Add at least one question with options and a marked correct answer." }); return; }
    try {
      await api.saveExam(token, { courseId, title: title.trim() || "Course assessment", passMark, published, questions: clean as ExamQuestion[] });
      setMsg({ ok: true, text: published ? "Saved & published." : "Saved as draft." });
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Couldn't save." }); }
    finally { setBusy(false); }
  };

  if (!open) {
    return <button onClick={() => setOpen(true)} style={{ ...ghost, display: "inline-flex", alignItems: "center", gap: "6px" }}><ClipboardCheck size={14} /> Exam / assessment</button>;
  }

  return (
    <div className="rounded-2xl p-5 mt-3" style={{ background: colors.bg, border: `1px solid ${colors.hairline}` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><ClipboardCheck size={16} style={{ color: colors.blue }} /><span style={{ fontWeight: 700, fontSize: "14px" }}>Assessment exam</span></div>
        <button onClick={() => setOpen(false)} style={{ ...ghost }}>Close</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="sm:col-span-1"><input style={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Exam title" /></div>
        <label className="flex items-center gap-2" style={{ fontSize: "13px", color: colors.heading }}>Pass mark <input type="number" min="1" max="100" style={{ ...input, width: "70px" }} value={passMark} onChange={(e) => setPassMark(Number(e.target.value))} /> %</label>
        <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: "13px", color: colors.heading }}><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Published (visible to students)</label>
      </div>

      <div className="flex flex-col gap-4">
        {questions.map((q, i) => (
          <div key={i} className="rounded-xl p-4" style={{ background: "#fff", border: `1px solid ${colors.hairline}` }}>
            <div className="flex items-start gap-2 mb-3">
              <span style={{ fontWeight: 700, color: colors.textTertiary, fontSize: "13px", paddingTop: "8px" }}>{i + 1}.</span>
              <input style={input} value={q.prompt} onChange={(e) => upd(i, { prompt: e.target.value })} placeholder="Question prompt" />
              <select style={{ ...input, width: "130px" }} value={q.kind} onChange={(e) => setKind(i, e.target.value as QuestionKind)}>
                <option value="single">Single choice</option>
                <option value="multi">Multiple answers</option>
                <option value="truefalse">True / False</option>
              </select>
              <input type="number" min="1" title="Points" style={{ ...input, width: "60px" }} value={q.points} onChange={(e) => upd(i, { points: Number(e.target.value) })} />
              <button onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", paddingTop: "6px" }}><Trash2 size={16} /></button>
            </div>
            <div className="flex flex-col gap-2 pl-6">
              {q.options.map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <input type={q.kind === "multi" ? "checkbox" : "radio"} name={`c-${i}`} checked={q.correct.includes(o.id)} onChange={() => toggleCorrect(i, o.id)} title="Correct answer" />
                  {q.kind === "truefalse" ? <span style={{ fontSize: "13.5px", color: colors.heading, width: "80px" }}>{o.text}</span> : (
                    <>
                      <input style={{ ...input, flex: 1 }} value={o.text} onChange={(e) => setOpt(i, o.id, e.target.value)} placeholder="Option text" />
                      <button onClick={() => rmOpt(i, o.id)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textTertiary }}><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              ))}
              {q.kind !== "truefalse" && <button onClick={() => addOpt(i)} style={{ ...ghost, alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 10px" }}><Plus size={12} /> Option</button>}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button onClick={() => setQuestions((qs) => [...qs, blankQ()])} style={{ ...ghost, display: "inline-flex", alignItems: "center", gap: "5px" }}><Plus size={14} /> Add question</button>
        <button onClick={save} disabled={busy} style={{ ...btn, opacity: busy ? 0.6 : 1, marginLeft: "auto" }}>{busy ? "Saving…" : "Save exam"}</button>
      </div>
      {msg && <p style={{ color: msg.ok ? colors.green : "#DC2626", fontSize: "13px", marginTop: "10px" }}>{msg.text}</p>}
    </div>
  );
}
