"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MicButton } from "../components/MicButton";
import { Waveform } from "../components/Waveform";
import { useRecorder } from "../hooks/useRecorder";
import { PROMPTS } from "../lib/prompts";
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
  const [screen, setScreen] = useState<Screen>("gate");
  const [mode, setMode] = useState<Mode>("prompts");
  const [search, setSearch] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );

  const [itemIndex, setItemIndex] = useState(0);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isProcessing = status === "processing";
  const canBegin = consented && name.trim().length > 0;

  const items = useMemo(
    () => (mode === "prompts" ? PROMPTS : selectedDocument?.paragraphs ?? []),
    [mode, selectedDocument]
  );
  const totalItems = items.length;
  const currentText = items[itemIndex] ?? "";

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
      if (blob) setPendingBlob(blob);
    } else {
      setError(null);
      setPendingBlob(null);
      await start();
    }
  };

  const handleSkip = () => {
    setPendingBlob(null);
    setError(null);
    advance();
  };

  const handleSubmit = async () => {
    if (!pendingBlob) return;
    setStatus("processing");
    setError(null);

    try {
      const wav = await blobToWav(pendingBlob);
      const filePath = `${sanitize(name)}_${itemIndex}_${Date.now()}.wav`;

      const { error: uploadError } = await supabase.storage
        .from("voice-recordings")
        .upload(filePath, wav, { contentType: "audio/wav" });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("voice_recordings")
        .insert({
          contributor_name: name.trim(),
          prompt_index: itemIndex,
          prompt_text: currentText,
          file_path: filePath,
          document_id: mode === "document" ? selectedDocument?.id ?? null : null,
        });
      if (insertError) throw insertError;

      setPendingBlob(null);
      advance();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setStatus("idle");
    }
  };

  const startPromptsMode = () => {
    setMode("prompts");
    setSelectedDocument(null);
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
    screen === "documentPicker" ? "max-w-2xl" : "max-w-md";

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
            isRecording={isRecording}
            isProcessing={isProcessing}
            analyser={analyser}
            pendingBlob={pendingBlob}
            error={error}
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
  canBegin,
  onContinue,
}: {
  consented: boolean;
  setConsented: (v: boolean) => void;
  name: string;
  setName: (v: string) => void;
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

      <div className="mt-8 rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground shadow-sm">
        By recording yourself here, you agree that your voice recordings
        will be used to train AI speech recognition models to better
        transcribe the voices of people with Friedreich&apos;s Ataxia.
        Recordings are stored securely and never shared publicly. You can
        request deletion at any time by emailing{" "}
        <a
          href="mailto:jakejuip@gmail.com"
          className="font-semibold underline"
        >
          jakejuip@gmail.com
        </a>
        .
      </div>

      <label className="mt-4 flex items-start gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => setConsented(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-mic"
        />
        I have read and agree to the above.
      </label>

      <div className="mt-6">
        <label className="mb-1 block text-sm text-muted">
          First name or nickname
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!consented}
          placeholder="e.g. Jordan"
          className="w-full rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent-soft disabled:opacity-50"
        />
      </div>

      <button
        type="button"
        disabled={!canBegin}
        onClick={onContinue}
        className="mt-8 rounded-full bg-mic px-6 py-3 text-sm font-semibold text-white transition-colors hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
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
  selected,
  onClick,
}: {
  title: string;
  subtitle: string;
  badge: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left shadow-sm transition-colors ${
        selected
          ? "border-2 border-mic bg-card"
          : "border border-border bg-card hover:bg-accent-soft/40"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold text-foreground">{title}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold text-white ${
            badge === "Recommended" ? "bg-mic" : "bg-accent"
          }`}
        >
          {badge}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
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

      <div className="mt-8 flex flex-col gap-4">
        <ModeCard
          title="Read guided prompts"
          subtitle="50 short sentences designed to capture a range of sounds and vocabulary."
          badge="Recommended"
          selected={mode === "prompts"}
          onClick={() => setMode("prompts")}
        />
        <ModeCard
          title="Read a document"
          subtitle="Choose a famous speech or public domain text and read naturally."
          badge="New"
          selected={mode === "document"}
          onClick={() => setMode("document")}
        />
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-8 rounded-full bg-mic px-6 py-3 text-sm font-semibold text-white transition-colors hover:brightness-105"
      >
        Continue
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

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by title or author"
        className="mt-6 w-full rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent-soft"
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <span className="font-semibold text-foreground">{doc.title}</span>
            <span className="mt-1 text-xs text-muted">
              {doc.author}, {doc.year}
            </span>
            <p className="mt-2 flex-1 text-sm text-muted">{doc.excerpt}</p>
            <button
              type="button"
              onClick={() => onSelect(doc)}
              className="mt-4 self-start rounded-full bg-mic px-4 py-2 text-xs font-semibold text-white transition-colors hover:brightness-105"
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
  isRecording,
  isProcessing,
  analyser,
  pendingBlob,
  error,
  onToggleClick,
  onSubmit,
  onSkip,
}: {
  mode: Mode;
  selectedDocument: Document | null;
  itemIndex: number;
  totalItems: number;
  currentText: string;
  isRecording: boolean;
  isProcessing: boolean;
  analyser: AnalyserNode | null;
  pendingBlob: Blob | null;
  error: string | null;
  onToggleClick: () => void;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  const unit = mode === "prompts" ? "Prompt" : "Paragraph";

  return (
    <div className="flex w-full flex-col items-center">
      {mode === "document" && selectedDocument && (
        <p className="text-sm text-muted">{selectedDocument.title}</p>
      )}
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted">
        {unit} {itemIndex + 1} of {totalItems}
      </p>

      <p className="mt-6 max-w-sm text-center text-xl font-semibold leading-snug text-foreground sm:text-2xl">
        {currentText}
      </p>

      <div className="mt-12 flex flex-col items-center gap-6">
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
              className="rounded-full bg-mic px-6 py-3 text-sm font-semibold text-white transition-colors hover:brightness-105"
            >
              Submit and next {mode === "prompts" ? "prompt" : "paragraph"}
            </button>
          )}
          {!isRecording && !isProcessing && (
            <button
              type="button"
              onClick={onSkip}
              className="rounded-full px-6 py-3 text-sm font-semibold text-muted transition-colors hover:bg-accent-soft hover:text-foreground"
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
      Your voice helps make dictation better for everyone with FA.
    </footer>
  );
}
