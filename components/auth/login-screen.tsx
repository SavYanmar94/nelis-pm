// ============================================================
// FIX MOBILE: components/auth/login-screen.tsx
// - Effetto 3D disattivato su dispositivi touch (poteva intercettare i tap)
// - h-screen → h-[100dvh] con piccolo scroll di sicurezza
// ============================================================

"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Playfair_Display, Manrope, Space_Mono } from "next/font/google";
import { signIn } from "@/app/login/actions";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600"] });
const manrope = Manrope({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400"] });

export function LoginScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Su dispositivi touch l'effetto "cursore 3D" non ha senso (non c'è un
    // puntatore da inseguire) e alcune di queste librerie intercettano i
    // touch a livello di documento, bloccando i tap sui pulsanti sottostanti.
    // Lo saltiamo del tutto su touch/coarse-pointer.
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (isCoarsePointer) return;

    let app: { dispose?: () => void } | undefined;
    let cancelled = false;

    import(
      /* webpackIgnore: true */
      "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js"
    )
      .then((mod) => {
        if (cancelled || !canvasRef.current) return;
        const TubesCursor = mod.default;
        app = TubesCursor(canvasRef.current, {
          tubes: {
            colors: ["#C7A76C", "#DFCeb0", "#9A8256"],
            lights: { intensity: 200, colors: ["#C7A76C", "#ffffff"] },
          },
        });
      })
      .catch(() => {
        // Se il CDN non è raggiungibile il login resta comunque utilizzabile.
      });

    return () => {
      cancelled = true;
      app?.dispose?.();
    };
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const result = await signIn(email, password);
        if (result.error) {
          setError(traduciErrore(result.error));
          return;
        }
        router.push("/dashboard");
        router.refresh();
      } catch (err) {
        // Prima non mostravamo nulla se la Server Action falliva a livello
        // di rete (es. cookie di sessione rifiutato su http non sicuro).
        console.error("Errore login:", err);
        setError(
          "Impossibile completare l'accesso. Se stai usando un indirizzo http:// in locale da telefono, il browser potrebbe rifiutare il cookie di sessione: prova con una connessione https."
        );
      }
    });
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-y-auto bg-[#0E0F12] flex flex-col items-center justify-center px-4 py-6">
      {/* pointer-events-none: il canvas non deve mai poter intercettare tap/click,
          anche se rimane visibile su desktop con puntatore fine */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, rgba(14,15,18,0.3) 0%, rgba(14,15,18,0.85) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        <img
          src="/logo-nelis-n.png"
          alt="Nelis"
          className="h-14 w-auto mb-5"
          style={{ filter: "drop-shadow(0 0 30px rgba(199,167,108,0.15))" }}
        />

        <h1
          className={`${playfair.className} text-white mb-6 leading-tight`}
          style={{
            fontSize: "clamp(1.5rem, 3.2vw, 2.2rem)",
            background: "linear-gradient(to right, #fff, #999)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Accedi per gestire
          <br />i tuoi cantieri.
        </h1>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="text-left">
            <label
              htmlFor="email"
              className={`${spaceMono.className} block text-[0.65rem] uppercase tracking-[0.1em] mb-1`}
              style={{ color: "#9A8256" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={`${manrope.className} w-full bg-transparent border-0 border-b border-white/10 focus:border-[#C7A76C] outline-none text-white py-2 text-sm transition-colors`}
              placeholder="email@esempio.com"
            />
          </div>

          <div className="text-left">
            <label
              htmlFor="password"
              className={`${spaceMono.className} block text-[0.65rem] uppercase tracking-[0.1em] mb-1`}
              style={{ color: "#9A8256" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={`${manrope.className} w-full bg-transparent border-0 border-b border-white/10 focus:border-[#C7A76C] outline-none text-white py-2 text-sm transition-colors`}
            />
          </div>

          {error && <p className={`${manrope.className} text-sm text-red-400`}>{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className={`${manrope.className} w-full border border-[#9A8256] text-white uppercase tracking-[0.2em] text-xs py-3 mt-2 transition-colors hover:bg-[#9A8256] hover:text-[#0E0F12] disabled:opacity-50`}
          >
            {isPending ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>

        <p className={`${manrope.className} text-white/40 text-xs mt-6`}>
          Non hai un account?{" "}
          <Link href="/register" className="text-[#C7A76C] hover:text-white transition-colors">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}

function traduciErrore(message: string): string {
  if (message.includes("Invalid login credentials")) return "Email o password non corretti.";
  if (message.includes("Email not confirmed")) return "Devi confermare l'email prima di accedere.";
  return message;
}