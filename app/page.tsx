"use client";

import { useEffect, useState } from "react";
import { MicButton } from "./components/MicButton";
import { ModeToggle } from "./components/ModeToggle";
import { Waveform } from "./components/Waveform";
import { SnippetsList } from "./components/SnippetsList";
import { Footer } from "./components/Footer";
import { useRecorder } from "./hooks/useRecorder";
import { Snippet } from "./lib/types";
import { addSnippet, deleteSnippet, loadSnippets } from "./lib/storage";

export default function Home() {
  const {
    status,
    setStatus,
    isRecording,
    error: recorderError,
    analyser,
    start,
    stop,
  } = useRecorder();
  const [holdMode, setHoldMode] = useState(true);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSnippets(loadSnippets());
  }, []);

  useEffect(() => {
    setError(recorderError);
  }, [recorderError]);

  const isProcessing = status === "processing";

  const handleStop = async () => {
    const blob = await stop();
    if (!blob) return;

    setError(null);
    setStatus("processing");
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Transcription failed.");
      }

      const text = (data.text ?? "").trim();
      if (text.length > 0) {
        setSnippets(addSnippet(text));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setStatus("idle");
    }
  };

  const handleToggleClick = async () => {
    if (isProcessing) return;
    if (isRecording) {
      await handleStop();
    } else {
      await start();
    }
  };

  const handlePressStart = async () => {
    if (isProcessing || isRecording) return;
    await start();
  };

  const handlePressEnd = async () => {
    if (!isRecording) return;
    await handleStop();
  };

  const handleDelete = (id: string) => {
    setSnippets(deleteSnippet(id));
  };

  return (
    <div className="flex flex-1 flex-col items-center px-6">
      <main className="flex w-full max-w-md flex-1 flex-col items-center pt-16 sm:pt-24">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Dictation
        </h1>
        <p className="mt-2 text-sm text-muted">
          {holdMode
            ? "Press and hold to speak, then watch it appear below."
            : "Tap to start, tap again to stop."}
        </p>

        <div className="mt-12 flex flex-col items-center gap-6">
          <Waveform analyser={analyser} active={isRecording} />

          <MicButton
            active={isRecording}
            disabled={isProcessing}
            holdMode={holdMode}
            onPressStart={handlePressStart}
            onPressEnd={handlePressEnd}
            onClick={handleToggleClick}
          />

          <ModeToggle
            holdMode={holdMode}
            onChange={setHoldMode}
            disabled={isRecording || isProcessing}
          />

          <div className="h-5 text-sm">
            {isProcessing && (
              <span className="text-muted">Transcribing&hellip;</span>
            )}
            {error && <span className="text-muted">{error}</span>}
          </div>
        </div>

        <SnippetsList snippets={snippets} onDelete={handleDelete} />
      </main>
      <Footer />
    </div>
  );
}
