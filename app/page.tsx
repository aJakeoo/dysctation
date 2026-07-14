"use client";

import { useEffect, useRef, useState } from "react";
import { MicButton } from "./components/MicButton";
import { ModeToggle } from "./components/ModeToggle";
import { Waveform } from "./components/Waveform";
import { SnippetsList } from "./components/SnippetsList";
import { Footer } from "./components/Footer";
import { BackgroundTexture } from "./components/BackgroundTexture";
import { useRecorder } from "./hooks/useRecorder";
import { Snippet } from "./lib/types";
import { addSnippet, deleteSnippet, loadSnippets } from "./lib/storage";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionConstructorLike {
  new (): SpeechRecognitionLike;
}

function getSpeechRecognitionCtor(): SpeechRecognitionConstructorLike | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

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
  const [interim, setInterim] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSnippets(loadSnippets());
  }, []);

  useEffect(() => {
    setError(recorderError);
  }, [recorderError]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const isProcessing = status === "processing";

  const startPreview = () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setInterim(text);
    };
    recognition.onerror = () => {};
    recognition.onend = () => {
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
    }
  };

  const stopPreview = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setInterim("");
  };

  const handleStop = async () => {
    stopPreview();
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
      startPreview();
      await start();
    }
  };

  const handlePressStart = async () => {
    if (isProcessing || isRecording) return;
    startPreview();
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
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <BackgroundTexture />

      <a
        href="https://dysctation.vercel.app/contribute"
        className="absolute right-5 top-5 z-10 inline-flex items-center gap-2 rounded-full border border-mic/25 bg-mic/10 px-4 py-2.5 text-[13.5px] font-extrabold text-mic transition-colors hover:bg-mic/[0.18] sm:right-7 sm:top-7"
      >
        Contribute your voice
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>

      <div className="relative z-10 flex flex-1 flex-col items-center px-6">
        <main className="flex w-full max-w-md flex-1 flex-col items-center pt-16 sm:pt-24">
          <div className="max-w-xl text-center">
            <h1 className="flex items-center justify-center gap-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              <span className="h-3.5 w-3.5 rounded-full bg-mic" />
              Dysctation
            </h1>
            <p className="mt-3.5 text-base font-semibold leading-snug text-ink-soft">
              {holdMode
                ? "Press and hold to speak, then watch it appear below."
                : "Tap to start, tap again to stop."}
            </p>
            <p className="mt-3 text-[13.5px] font-medium text-muted-light">
              Your transcriptions appear below. Click any card to copy.
            </p>
          </div>

          <div className="mt-9 flex flex-col items-center gap-6">
            <div
              className={`flex h-16 w-full max-w-[520px] items-center justify-center rounded-2xl border-[1.5px] border-dashed transition-colors duration-300 ${
                isRecording ? "border-mic/35 bg-mic/[0.03]" : "border-border"
              }`}
            >
              <Waveform analyser={analyser} active={isRecording} />
            </div>

            <MicButton
              active={isRecording}
              disabled={isProcessing}
              holdMode={holdMode}
              onPressStart={handlePressStart}
              onPressEnd={handlePressEnd}
              onClick={handleToggleClick}
              activeVariant="grey"
            />

            <ModeToggle
              holdMode={holdMode}
              onChange={setHoldMode}
              disabled={isRecording || isProcessing}
            />

            <div className="min-h-5 max-w-md text-center text-sm">
              {isProcessing && (
                <span className="text-muted">Transcribing&hellip;</span>
              )}
              {!isProcessing && error && (
                <span className="text-muted">{error}</span>
              )}
              {!isProcessing && !error && isRecording && interim && (
                <span className="font-semibold text-ink-soft">{interim}</span>
              )}
            </div>
          </div>

          <div className="mt-10 w-full">
            <SnippetsList snippets={snippets} onDelete={handleDelete} />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
