import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, CheckCircle2, XCircle, RefreshCw, LifeBuoy, Award } from "lucide-react";
import { colors, gradientBrand, shadow } from "../../lib/brand";
import { studentApi } from "../../lib/api";
import type { StudentExam, ExamResult } from "../../config/academy";

export function ExamPanel({ token, courseId, courseCompleted }: { token: string; courseId: string; courseCompleted: boolean }) {
  const [data, setData] = useState<StudentExam | null>(null);
  const [mode, setMode] = useState<"idle" | "taking" | "result">("idle");
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<ExamResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    studentApi.exam(token, courseId).then(setData).catch(() => setData({ exam: null }));
  }, [token, courseId]);
  useEffect(() => { load(); }, [load]);

  if (!data || !data.exam) return null;
  const { exam, status } = data;

  const setAnswer = (qid: string, optId: string, kind: string) => {
    setAnswers((prev) => {
      if (kind === "multi") {
        const cur = new Set(prev[qid] || []);
        if (cur.has(optId)) cur.delete(optId); else cur.add(optId);
        return { ...prev, [qid]: [...cur] };
      }
      return { ...prev, [qid]: [optId] };
    });
  };

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const r = await studentApi.submitExam(token, courseId, answers);
      setResult(r); setMode("result"); load();
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't submit."); }
    finally { setBusy(false); }
  };

  const wrap = (children: React.ReactNode) => (
    <div className="rounded-2xl p-6" style={{ background: "#fff", border: `1px solid ${colors.hairline}`, boxShadow: shadow.sm }}>
      <div className="flex items-center gap-2 mb-4"><ClipboardCheck size={18} style={{ color: colors.blue }} /><h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{exam.title}</h3></div>
      {children}
    </div>
  );

  // Result view
  if (mode === "result" && result) {
    return wrap(
      <div>
        <div className="flex items-center gap-3 mb-3">
          {result.passed ? <CheckCircle2 size={26} style={{ color: colors.green }} /> : <XCircle size={26} style={{ color: "#DC2626" }} />}
          <div>
            <p style={{ fontWeight: 800, fontSize: "1.3rem", color: result.passed ? colors.green : "#DC2626" }}>{result.score}%</p>
            <p style={{ fontSize: "13px", color: colors.textTertiary }}>Pass mark: {result.passMark}% · Attempt {result.attemptNo}</p>
          </div>
        </div>
        {result.passed ? (
          <p style={{ color: colors.textSecondary, fontSize: "14.5px", lineHeight: 1.6 }}><Award size={15} style={{ color: colors.green, display: "inline", verticalAlign: "-2px" }} /> You passed! Your instructor can now issue your certificate.</p>
        ) : result.canRetake ? (
          <>
            <p style={{ color: colors.textSecondary, fontSize: "14.5px", lineHeight: 1.6, marginBottom: "14px" }}>Not quite — you have {result.attemptsLeft} attempt{result.attemptsLeft === 1 ? "" : "s"} left.</p>
            <button onClick={() => { setAnswers({}); setResult(null); setMode("taking"); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white" style={{ background: gradientBrand, fontSize: "14px" }}><RefreshCw size={15} /> Try again</button>
          </>
        ) : (
          <p style={{ color: colors.textSecondary, fontSize: "14.5px", lineHeight: 1.6 }}><LifeBuoy size={15} style={{ display: "inline", verticalAlign: "-2px", color: colors.blue }} /> You've used all your attempts. Please contact support or your instructor, who can grant another attempt.</p>
        )}
      </div>
    );
  }

  // Taking view
  if (mode === "taking") {
    const allAnswered = exam.questions.every((q) => (answers[q.id] || []).length > 0);
    return wrap(
      <div className="flex flex-col gap-6">
        {exam.questions.map((q, i) => (
          <div key={q.id}>
            <p style={{ fontWeight: 600, color: colors.heading, fontSize: "15px", marginBottom: "10px" }}>{i + 1}. {q.prompt}{q.kind === "multi" && <span style={{ color: colors.textTertiary, fontWeight: 400, fontSize: "12.5px" }}> (select all that apply)</span>}</p>
            <div className="flex flex-col gap-2">
              {q.options.map((o) => {
                const on = (answers[q.id] || []).includes(o.id);
                return (
                  <label key={o.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer" style={{ border: `1px solid ${on ? colors.blue : colors.hairline}`, background: on ? `${colors.blue}0a` : "#fff" }}>
                    <input type={q.kind === "multi" ? "checkbox" : "radio"} name={q.id} checked={on} onChange={() => setAnswer(q.id, o.id, q.kind)} />
                    <span style={{ fontSize: "14px", color: colors.heading }}>{o.text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
        {error && <p style={{ color: "#DC2626", fontSize: "13.5px" }}>{error}</p>}
        <div className="flex items-center gap-3">
          <button onClick={submit} disabled={busy || !allAnswered} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white disabled:opacity-50" style={{ background: gradientBrand, fontSize: "14px" }}>{busy ? "Submitting…" : "Submit answers"}</button>
          <button onClick={() => setMode("idle")} style={{ color: colors.textTertiary, fontSize: "13.5px", background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    );
  }

  // Idle view
  return wrap(
    <div>
      {status?.passed ? (
        <p style={{ color: colors.green, fontSize: "14.5px", fontWeight: 600 }}><CheckCircle2 size={16} style={{ display: "inline", verticalAlign: "-3px" }} /> Passed — best score {status.bestScore}%.</p>
      ) : (
        <>
          <p style={{ color: colors.textSecondary, fontSize: "14.5px", lineHeight: 1.6, marginBottom: "14px" }}>
            {courseCompleted ? "Take the assessment to complete the course." : "Finish the lessons, then take the assessment."} Pass mark {exam.passMark}%.
            {status && <> · {status.attemptsUsed}/{status.maxAttempts} attempts used.</>}
          </p>
          {status?.canTake ? (
            <button onClick={() => { setAnswers({}); setResult(null); setError(null); setMode("taking"); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white" style={{ background: gradientBrand, fontSize: "14px" }}><ClipboardCheck size={15} /> Take assessment</button>
          ) : (
            <p style={{ color: colors.textSecondary, fontSize: "14px" }}><LifeBuoy size={14} style={{ display: "inline", verticalAlign: "-2px", color: colors.blue }} /> No attempts left — contact support or your instructor for another attempt.</p>
          )}
        </>
      )}
    </div>
  );
}
