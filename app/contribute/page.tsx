"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MicButton } from "../components/MicButton";
import { Waveform } from "../components/Waveform";
import { useRecorder } from "../hooks/useRecorder";
import { PROMPTS } from "../lib/prompts";
import { blobToWav } from "../lib/audioToWav";
import { supabase } from "../lib/supabase";

const TOTAL_PROMPTS = PROMPTS.length;

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
  const [started, setStarted] = useState(false);

  const [promptIndex, setPromptIndex] = useState(0);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isProcessing = status === "processing";
  const isFinished = started && promptIndex >= TOTAL_PROMPTS;

  useEffect(() => {
    setError(recorderError);
  }, [recorderError]);

  const canBegin = consented && name.trim().length > 0;

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
    setPromptIndex((i) => i + 1);
  };

  const handleSubmit = async () => {
    if (!pendingBlob) return;
    setStatus("processing");
    setError(null);

    try {
      const wav = await blobToWav(pendingBlob);
      const filePath = `${sanitize(name)}_${promptIndex}_${Date.now()}.wav`;

      const { error: uploadError } = await supabase.storage
        .from("voice-recordings")
        .upload(filePath, wav, { contentType: "audio/wav" });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("voice_recordings")
        .insert({
          contributor_name: name.trim(),
          prompt_index: promptIndex,
          prompt_text: PROMPTS[promptIndex],
          file_path: filePath,
        });
      if (insertError) throw insertError;

      setPendingBlob(null);
      setPromptIndex((i) => i + 1);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setStatus("idle");
    }
  };

  if (!started) {
    return (
      <div className="flex flex-1 flex-col items-center px-6">
        <main className="flex w-full max-w-md flex-1 flex-col pt-16 sm:pt-24">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Contribute your voice
          </h1>
          <p className="mt-2 text-sm text-muted">
            Help train speech recognition to better understand voices like
            yours.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground shadow-sm">
            By recording yourself here, you agree that your voice recordings
            may be used to train speech recognition models to better
            understand FA voices. Recordings are stored securely and never
            shared publicly. You can request deletion at any time by emailing{" "}
            <a
              href="mailto:jake@dysctation.app"
              className="font-semibold underline"
            >
              jake@dysctation.app
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
            onClick={() => setStarted(true)}
            className="mt-8 rounded-full bg-mic px-6 py-3 text-sm font-semibold text-white transition-colors hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start recording
          </button>
        </main>
        <ContributeFooter />
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-1 flex-col items-center px-6">
        <main className="flex w-full max-w-md flex-1 flex-col items-center justify-center pt-16 text-center sm:pt-24">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Thank you
          </h1>
          <p className="mt-4 text-sm text-muted">
            You&apos;ve completed all {TOTAL_PROMPTS} prompts. Thank you for
            helping make dictation better for everyone with FA.
          </p>
          <Link
            href="/"
            className="mt-8 rounded-full bg-mic px-6 py-3 text-sm font-semibold text-white transition-colors hover:brightness-105"
          >
            Back to Dysctation
          </Link>
        </main>
        <ContributeFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center px-6">
      <main className="flex w-full max-w-md flex-1 flex-col items-center pt-16 sm:pt-24">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Prompt {promptIndex + 1} of {TOTAL_PROMPTS}
        </p>

        <p className="mt-6 max-w-sm text-center text-xl font-semibold leading-snug text-foreground sm:text-2xl">
          {PROMPTS[promptIndex]}
        </p>

        <div className="mt-12 flex flex-col items-center gap-6">
          <Waveform analyser={analyser} active={isRecording} />

          <MicButton
            active={isRecording}
            disabled={isProcessing}
            holdMode={false}
            onPressStart={() => {}}
            onPressEnd={() => {}}
            onClick={handleToggleClick}
          />

          <div className="h-5 text-sm">
            {isProcessing && (
              <span className="text-muted">Uploading&hellip;</span>
            )}
            {error && <span className="text-muted">{error}</span>}
          </div>

          <div className="flex items-center gap-3">
            {pendingBlob && !isProcessing && (
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-full bg-mic px-6 py-3 text-sm font-semibold text-white transition-colors hover:brightness-105"
              >
                Submit and next prompt
              </button>
            )}
            {!isRecording && !isProcessing && (
              <button
                type="button"
                onClick={handleSkip}
                className="rounded-full px-6 py-3 text-sm font-semibold text-muted transition-colors hover:bg-accent-soft hover:text-foreground"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </main>
      <ContributeFooter />
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
