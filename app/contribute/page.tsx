"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MicButton } from "../components/MicButton";
import { Waveform } from "../components/Waveform";
import { useRecorder } from "../hooks/useRecorder";
import { CATEGORY_NOTES, PROMPTS, Prompt, shufflePrompts } from "../lib/prompts";
import { DOCUMENTS, Document } from "../lib/documents";
import { blobToWav } from "../lib/audioToWav";
import { supabase } from "../lib/supabase";

type Mode = "prompts" | "document";
type Screen = "gate" | "mode" | "documentPicker" | "recording" | "finished";

function sanitize(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 40) || "anonymous";
}

export default function ContributePage() {
  const {
    status,
    setStatus,
    isRecording,
    error: recorderError,
    analyser,
    start,
    stop,
  } = useRecorder();

  const [consented, setConsented] = useState(false);
  const [name, setName] = useState("");
  const [hasFA, setHasFA] = useState<boolean | null>(null);
  const [screen, setScreen] = useState<Screen>("gate");
  const [mode, setMode] = useState<Mode>("prompts");
  const [search, setSearch] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [sessionPrompts, setSessionPrompts] = useState<Prompt[]>(PROMPTS);

  const [itemIndex, setItemIndex] = useState(0);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitCooldown, setSubmitCooldown] = useState(false);

  const isProcessing = status === "processing";
  const canBegin = consented && name.trim().length > 0 && hasFA !== null;

  const items = useMemo(
    () =>
      mode === "prompts"
        ? sessionPrompts.map((p) => ({ text: p.text, note: CATEGORY_NOTES[p.category] }))
        : (selectedDocument?.paragraphs ?? []).map((text) => ({ text, note: undefined })),
    [mode, sessionPrompts, selectedDocument]
  );
  const totalItems = items.length;
  const currentItem = items[itemIndex];
  const currentText = currentItem?.text ?? "";
  const currentNote = currentItem?.note;

  useEffect(() => {
    setError(recorderError);
  }, [recorderError]);

  const advance = () => {
    const next = itemIndex + 1;
    if (next >= totalItems) {
      setScreen("finished");
    } else {
      setItemIndex(next);
    }
  };

  const handleToggleClick = async () => {
    if (isProcessing) return;
    if (isRecording) {
      const blob = await stop();
      console.error("[contribute] stop() returned blob", blob && { size: blob.size, type: blob.type });
      if (blob) {
        setPendingBlob(blob);
      } else {
        console.error("[contribute] stop() returned no blob; nothing to submit");
      }
    } else {
      setError(null);
      setPendingBlob(null);
      try {
        await start();
      } catch (startError) {
        console.error("[contribute] start() failed", startError);
        throw startError;
      }
    }
  };

  const handleSkip = () => {
    setPendingBlob(null);
    setError(null);
    advance();
  };

  const handleSubmit = async () => {
    if (!pendingBlob) {
      console.error("[contribute] handleSubmit called with no pendingBlob");
      return;
    }
    if (submitCooldown) {
      console.error("[contribute] handleSubmit blocked by submit cooldown");
      return;
    }
    setSubmitCooldown(true);
    setTimeout(() => setSubmitCooldown(false), 2000);

    console.error("[contribute] handleSubmit start", {
      size: pendingBlob.size,
      type: pendingBlob.type,
    });
    setStatus("processing");
    setError(null);

    try {
      let wav: Blob;
      try {
        wav = await blobToWav(pendingBlob);
      } catch (wavError) {
        console.error("[contribute] blobToWav threw", wavError);
        throw wavError;
      }
      console.error("[contribute] wav conversion complete", {
        size: wav.size,
        type: wav.type,
      });

      const filePath = `${sanitize(name)}_${itemIndex}_${Date.now()}.wav`;
      console.error("[contribute] uploading to storage", { filePath });

      const { error: uploadError } = await supabase.storage
        .from("voice-recordings")
        .upload(filePath, wav, { contentType: "audio/wav" });
      if (uploadError) {
        console.error("[contribute] storage upload failed", uploadError);
        throw uploadError;
      }
      console.error("[contribute] storage upload succeeded", { filePath });

      console.error("[contribute] inserting voice_recordings row", {
        prompt_index: itemIndex,
        file_path: filePath,
      });
      const { error: insertError } = await supabase
        .from("voice_recordings")
        .insert({
          contributor_name: name.trim(),
          prompt_index: itemIndex,
          prompt_text: currentText,
          file_path: filePath,
          document_id: mode === "document" ? selectedDocument?.id ?? null : null,
          has_fa: hasFA,
        });
      if (insertError) {
        console.error("[contribute] insert failed", insertError);
        throw insertError;
      }
      console.error("[contribute] insert succeeded");

      setPendingBlob(null);
      advance();
    } catch (err) {
      console.error("[contribute] handleSubmit failed", err);
      setError("Upload failed. Please try again.");
    } finally {
      setStatus("idle");
    }
  };

  const startPromptsMode = () => {
    setMode("prompts");
    setSelectedDocument(null);
    setSessionPrompts(shufflePrompts(PROMPTS));
    setItemIndex(0);
    setScreen("recording");
  };

  const handleContinueFromMode = () => {
    if (mode === "prompts") {
      startPromptsMode();
    } else {
      setScreen("documentPicker");
    }
  };

  const handleSelectDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setItemIndex(0);
    setScreen("recording");
  };

  const filteredDocuments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DOCUMENTS;
    return DOCUMENTS.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.author.toLowerCase().includes(q)
    );
  }, [search]);

  const mainWidthClass =
    screen === "documentPicker" || screen === "mode" ? "max-w-2xl" : "max-w-md";

  return (
    <div className="bg-wireframe flex flex-1 flex-col items-center px-6">
      <main
        className={`flex w-full ${mainWidthClass} flex-1 flex-col items-center pt-16 sm:pt-24`}
      >
        {screen === "gate" && (
          <GateScreen
            consented={consented}
            setConsented={setConsented}
            name={name}
            setName={setName}
            hasFA={hasFA}
            setHasFA={setHasFA}
            canBegin={canBegin}
            onContinue={() => setScreen("mode")}
          />
        )}

        {screen === "mode" && (
          <ModeScreen
            mode={mode}
            setMode={setMode}
            onContinue={handleContinueFromMode}
          />
        )}

        {screen === "documentPicker" && (
          <DocumentPickerScreen
            search={search}
            setSearch={setSearch}
            documents={filteredDocuments}
            onSelect={handleSelectDocument}
          />
        )}

        {screen === "recording" && (
          <RecordingScreen
            mode={mode}
            selectedDocument={selectedDocument}
            itemIndex={itemIndex}
            totalItems={totalItems}
            currentText={currentText}
            currentNote={currentNote}
            isRecording={isRecording}
            isProcessing={isProcessing}
            analyser={analyser}
            pendingBlob={pendingBlob}
            error={error}
            submitCooldown={submitCooldown}
            onToggleClick={handleToggleClick}
            onSubmit={handleSubmit}
            onSkip={handleSkip}
          />
        )}

        {screen === "finished" && (
          <FinishedScreen
            mode={mode}
            totalItems={totalItems}
            documentTitle={selectedDocument?.title}
          />
        )}
      </main>
      <ContributeFooter />
    </div>
  );
}

function GateScreen({
  consented,
  setConsented,
  name,
  setName,
  hasFA,
  setHasFA,
  canBegin,
  onContinue,
}: {
  consented: boolean;
  setConsented: (v: boolean) => void;
  name: string;
  setName: (v: string) => void;
  hasFA: boolean | null;
  setHasFA: (v: boolean) => void;
  canBegin: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="flex w-full flex-col">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
        Contribute your voice
      </h1>
      <p className="mt-2 text-sm text-muted">
        Help train speech recognition to better understand voices like
        yours.
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <label className="flex items-start gap-3.5 text-[15px] leading-relaxed text-ink-soft">
          <input
            type="checkbox"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
            className="mt-1 h-[18px] w-[18px] flex-shrink-0 accent-mic"
          />
          By recording yourself here, you agree that your voice recordings
          will be used to train AI speech recognition models to better
          transcribe the voices of people with Friedreich&apos;s Ataxia.
          Recordings are stored securely and never shared publicly. You can
          request deletion at any time by emailing{" "}
          <a
            href="mailto:jakejuip@gmail.com"
            className="font-semibold text-foreground underline"
          >
            jakejuip@gmail.com
          </a>
          .
        </label>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-bold text-foreground">
            First name or nickname
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!consented}
            placeholder="e.g. Jordan"
            className="w-full rounded-xl border-[1.5px] border-border bg-white px-4 py-3.5 text-base text-foreground outline-none focus:border-mic disabled:opacity-50"
          />
        </div>

        <fieldset className="mt-6">
          <legend className="mb-2 block text-sm font-bold text-foreground">
            Do you have Friedreich&apos;s Ataxia?
          </legend>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label
              className={`flex flex-1 cursor-pointer items-center gap-2.5 rounded-xl border-[1.5px] px-4 py-3.5 transition-colors ${
                hasFA === true
                  ? "border-mic bg-accent-soft"
                  : "border-border hover:border-mic"
              }`}
            >
              <input
                type="radio"
                name="has-fa"
                checked={hasFA === true}
                onChange={() => setHasFA(true)}
                className="h-[18px] w-[18px] flex-shrink-0 accent-mic"
              />
              <span className="text-[15px] font-bold text-foreground">
                Yes, I have FA
              </span>
            </label>
            <label
              className={`flex flex-1 cursor-pointer items-center gap-2.5 rounded-xl border-[1.5px] px-4 py-3.5 transition-colors ${
                hasFA === false
                  ? "border-mic bg-accent-soft"
                  : "border-border hover:border-mic"
              }`}
            >
              <input
                type="radio"
                name="has-fa"
                checked={hasFA === false}
                onChange={() => setHasFA(false)}
                className="h-[18px] w-[18px] flex-shrink-0 accent-mic"
              />
              <span className="text-[15px] font-bold text-foreground">
                No, I don&apos;t have FA
              </span>
            </label>
          </div>
          <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
            Both FA and non-FA voices are valuable for training. Non-FA
            voices help the model understand the difference.
          </p>
        </fieldset>
      </div>

      <button
        type="button"
        disabled={!canBegin}
        onClick={onContinue}
        className="mt-8 self-start rounded-full bg-mic px-7 py-3.5 text-[15px] font-extrabold text-white shadow-[0_6px_18px_rgba(79,127,199,0.35)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        Continue
      </button>
    </div>
  );
}

function ModeCard({
  title,
  subtitle,
  badge,
  icon,
  selected,
  onClick,
}: {
  title: string;
  subtitle: string;
  badge: string;
  icon: ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full rounded-2xl border-2 p-6 text-left transition-all hover:-translate-y-0.5 ${
        selected
          ? "border-mic bg-gradient-to-b from-accent-soft to-card to-60% shadow-[0_8px_24px_rgba(79,127,199,0.18)]"
          : "border-border bg-card shadow-sm hover:shadow-md"
      }`}
    >
      <span
        className={`absolute right-[18px] top-[18px] rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${
          selected ? "bg-mic text-white" : "bg-accent-soft text-muted"
        }`}
      >
        {badge}
      </span>

      <div
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
          selected ? "bg-mic text-white" : "bg-accent-soft text-muted"
        }`}
      >
        {icon}
      </div>

      <h3 className="mb-2 text-lg font-extrabold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-ink-soft">{subtitle}</p>

      <span
        className={`absolute bottom-5 right-5 h-[22px] w-[22px] rounded-full border-2 ${
          selected
            ? "border-mic bg-mic shadow-[inset_0_0_0_4px_#fff]"
            : "border-border bg-white"
        }`}
      />
    </button>
  );
}

function ModeScreen({
  mode,
  setMode,
  onContinue,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex w-full flex-col">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
        Choose how to record
      </h1>
      <p className="mt-2 text-sm text-muted">
        Pick whichever feels more natural to read out loud.
      </p>

      <div className="mt-8 grid w-full grid-cols-1 gap-[18px] sm:grid-cols-2">
        <ModeCard
          title="Read guided prompts"
          subtitle="85 short sentences designed to capture a range of sounds and vocabulary. Best for first-time contributors."
          badge="Recommended"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="9" y="2.5" width="6" height="12" rx="3" strokeWidth={2} />
              <path d="M5.5 11a6.5 6.5 0 0 0 13 0" strokeWidth={2} strokeLinecap="round" fill="none" />
            </svg>
          }
          selected={mode === "prompts"}
          onClick={() => setMode("prompts")}
        />
        <ModeCard
          title="Read a document"
          subtitle="Choose a famous speech or public domain text and read naturally. Great for longer sessions."
          badge="New"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="5" y="3" width="14" height="18" rx="2" strokeWidth={2} />
              <line x1="8.5" y1="8" x2="15.5" y2="8" strokeWidth={1.6} strokeLinecap="round" />
              <line x1="8.5" y1="12" x2="15.5" y2="12" strokeWidth={1.6} strokeLinecap="round" />
              <line x1="8.5" y1="16" x2="12.5" y2="16" strokeWidth={1.6} strokeLinecap="round" />
            </svg>
          }
          selected={mode === "document"}
          onClick={() => setMode("document")}
        />
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-8 self-start rounded-full bg-mic px-7 py-3.5 text-[15px] font-extrabold text-white shadow-[0_6px_18px_rgba(79,127,199,0.35)] transition-all hover:brightness-105"
      >
        Start recording
      </button>
    </div>
  );
}

function DocumentPickerScreen({
  search,
  setSearch,
  documents,
  onSelect,
}: {
  search: string;
  setSearch: (v: string) => void;
  documents: Document[];
  onSelect: (doc: Document) => void;
}) {
  return (
    <div className="flex w-full flex-col">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
        Choose a document
      </h1>
      <p className="mt-2 text-sm text-muted">
        Search by title or author, then select one to start reading.
      </p>

      <div className="relative mt-6">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#8a8378"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or author"
          className="w-full rounded-xl border-[1.5px] border-border bg-white py-3.5 pl-11 pr-4 text-[15px] text-foreground outline-none focus:border-mic"
        />
      </div>

      <div className="mt-[22px] grid grid-cols-1 gap-4 sm:grid-cols-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex flex-col gap-2.5 rounded-2xl border-[1.5px] border-border bg-card p-5"
          >
            <h4 className="text-base font-extrabold text-foreground">
              {doc.title}
            </h4>
            <span className="text-[12.5px] font-bold uppercase tracking-wide text-muted">
              {doc.author} &middot; {doc.year}
            </span>
            <p className="flex-1 border-l-[3px] border-border pl-2.5 text-[13.5px] italic leading-relaxed text-ink-soft">
              {doc.excerpt}
            </p>
            <button
              type="button"
              onClick={() => onSelect(doc)}
              className="mt-1 self-start rounded-full bg-accent-soft px-[18px] py-2 text-[13.5px] font-extrabold text-foreground transition-colors hover:bg-mic hover:text-white"
            >
              Select
            </button>
          </div>
        ))}
        {documents.length === 0 && (
          <p className="text-sm text-muted">No documents match your search.</p>
        )}
      </div>
    </div>
  );
}

function RecordingScreen({
  mode,
  selectedDocument,
  itemIndex,
  totalItems,
  currentText,
  currentNote,
  isRecording,
  isProcessing,
  analyser,
  pendingBlob,
  error,
  submitCooldown,
  onToggleClick,
  onSubmit,
  onSkip,
}: {
  mode: Mode;
  selectedDocument: Document | null;
  itemIndex: number;
  totalItems: number;
  currentText: string;
  currentNote?: string;
  isRecording: boolean;
  isProcessing: boolean;
  analyser: AnalyserNode | null;
  pendingBlob: Blob | null;
  error: string | null;
  submitCooldown: boolean;
  onToggleClick: () => void;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  const docTitle =
    mode === "document" && selectedDocument ? selectedDocument.title : "Guided prompts";
  const progressPct = totalItems > 0 ? Math.round(((itemIndex + 1) / totalItems) * 100) : 0;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex w-full max-w-sm items-center gap-3">
        <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-accent-soft">
          <div
            className="h-full rounded-full bg-mic transition-[width] duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="whitespace-nowrap text-[13px] font-extrabold text-muted">
          {itemIndex + 1} / {totalItems}
        </span>
      </div>
      <p className="mt-2.5 text-[13px] font-extrabold uppercase tracking-wide text-muted">
        {docTitle}
      </p>

      <div className="mt-6 flex min-h-[180px] w-full max-w-sm items-center justify-center rounded-2xl border-[1.5px] border-border bg-card px-10 py-12 text-center">
        <p className="text-xl font-bold leading-snug text-foreground sm:text-2xl">
          {currentText}
        </p>
      </div>

      {currentNote && (
        <p className="mt-3 max-w-sm text-center text-[13px] italic leading-relaxed text-muted">
          {currentNote}
        </p>
      )}

      <div className="mt-4 flex flex-col items-center gap-6">
        <Waveform analyser={analyser} active={isRecording} />

        <MicButton
          active={isRecording}
          disabled={isProcessing}
          holdMode={false}
          onPressStart={() => {}}
          onPressEnd={() => {}}
          onClick={onToggleClick}
          activeVariant="grey"
        />

        <div className="h-5 text-sm">
          {isProcessing && <span className="text-muted">Uploading&hellip;</span>}
          {error && <span className="text-muted">{error}</span>}
        </div>

        <div className="flex items-center gap-3">
          {pendingBlob && !isProcessing && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitCooldown}
              className="rounded-full bg-mic px-7 py-3.5 text-[15px] font-extrabold text-white shadow-[0_6px_18px_rgba(79,127,199,0.35)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:brightness-100"
            >
              Submit and next {mode === "prompts" ? "prompt" : "paragraph"}
            </button>
          )}
          {!isRecording && !isProcessing && (
            <button
              type="button"
              onClick={onSkip}
              className="rounded-full bg-accent-soft px-7 py-3.5 text-[15px] font-extrabold text-foreground transition-colors hover:bg-border"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FinishedScreen({
  mode,
  totalItems,
  documentTitle,
}: {
  mode: Mode;
  totalItems: number;
  documentTitle?: string;
}) {
  const description =
    mode === "prompts"
      ? `You've completed all ${totalItems} prompts.`
      : `You've completed all ${totalItems} paragraphs of "${documentTitle}".`;

  return (
    <div className="flex w-full flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
        Thank you
      </h1>
      <p className="mt-4 text-sm text-muted">
        {description} Thank you for helping make dictation better for
        everyone with FA.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-mic px-6 py-3 text-sm font-semibold text-white transition-colors hover:brightness-105"
      >
        Back to Dysctation
      </Link>
    </div>
  );
}

function ContributeFooter() {
  return (
    <footer className="w-full py-6 text-center text-xs text-muted-light">
      <p>Your voice helps make dictation better for everyone with FA.</p>
      <p className="mt-2">
        <Link href="/privacy" className="underline hover:text-muted">
          Privacy
        </Link>
      </p>
    </footer>
  );
}
