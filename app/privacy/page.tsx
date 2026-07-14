import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="bg-wireframe flex flex-1 flex-col items-center px-6">
      <main className="flex w-full max-w-2xl flex-1 flex-col pb-16 pt-16 sm:pt-24">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Privacy Policy
        </h1>

        <section className="mt-8">
          <h2 className="text-lg font-extrabold text-foreground">
            Dictation (main page)
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            <li>Audio is recorded only while you are actively dictating.</li>
            <li>
              Audio chunks are sent to Groq&apos;s Whisper API for
              transcription and nowhere else.
            </li>
            <li>
              Groq does not use API data to train models and does not retain
              it beyond processing.
            </li>
            <li>
              Transcribed text is stored in your browser&apos;s local storage
              only and is never uploaded.
            </li>
            <li>No analytics, tracking, or logging of any kind.</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-extrabold text-foreground">
            Voice contributions (/contribute page)
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            <li>Recordings are made only with your explicit consent.</li>
            <li>
              Your recordings and the text you read are stored securely in a
              private database.
            </li>
            <li>
              Recordings will be used solely to train AI speech recognition
              models to better transcribe the voices of people with
              Friedreich&apos;s Ataxia.
            </li>
            <li>Recordings are never shared publicly or sold.</li>
            <li>
              Whether you have FA is stored alongside your recordings to help
              train the model.
            </li>
            <li>
              You can request deletion of all your recordings at any time by
              emailing{" "}
              <a
                href="mailto:jakejuip@gmail.com"
                className="font-semibold text-foreground underline"
              >
                jakejuip@gmail.com
              </a>
              .
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-extrabold text-foreground">Contact</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Questions about your data:{" "}
            <a
              href="mailto:jakejuip@gmail.com"
              className="font-semibold text-foreground underline"
            >
              jakejuip@gmail.com
            </a>
          </p>
        </section>

        <Link
          href="/"
          className="mt-10 self-start rounded-full bg-mic px-6 py-3 text-sm font-semibold text-white transition-colors hover:brightness-105"
        >
          Back to Dysctation
        </Link>
      </main>
    </div>
  );
}
