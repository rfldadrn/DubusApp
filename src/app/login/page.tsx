"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Manrope, Playfair_Display } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ruler, Scissors } from "lucide-react";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"] });

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Username atau password salah");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan saat login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={`${manrope.className} min-h-screen bg-slate-100`}>
      <section className="flex min-h-screen w-full overflow-hidden">
        <aside className="relative hidden w-1/2 overflow-hidden bg-[#0F172A] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0">
            <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-slate-300/10 blur-3xl" />
          </div>

          <div className="relative z-10 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 duration-700">
            <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1 text-xs tracking-[0.2em] text-slate-200">
              Tailor Management System
            </div>
            <h1 className={`${playfair.className} max-w-xl text-4xl leading-tight text-slate-50 xl:text-5xl`}>
              Precision Tailoring, Seamless Operations.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300">
              Kelola transaksi, produksi, dan progress jahitan dalam satu dashboard profesional untuk tim jahit modern.
            </p>
          </div>

          <div className="relative z-10 mt-12 flex items-end justify-between text-slate-300">
            <div className="flex items-center gap-2 text-sm">
              <Ruler className="h-4 w-4" />
              Crafted for Detail
            </div>
            <Scissors className="h-5 w-5" />
          </div>

          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 1000 1000"
            fill="none"
          >
            <g stroke="rgba(255,255,255,0.22)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M128 710 Q208 690 245 634 L245 430 Q245 360 305 360 H695 Q760 360 760 425 V620 Q760 676 814 705" />
              <path d="M290 360 V302 H515 Q610 302 650 332" />
              <rect x="327" y="450" width="350" height="152" rx="20" />
              <circle cx="420" cy="694" r="58" />
              <circle cx="640" cy="694" r="58" />
              <path d="M420 636 L640 636" />
              <path d="M602 270 C680 245 742 258 818 298" />
              <path d="M720 244 L758 222" />
              <path d="M748 270 L786 248" />
              <path d="M776 298 L814 276" />
            </g>
            <path
              d="M45 884 C220 814 360 842 484 892 C642 953 770 925 951 844"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray="9 13"
            />
          </svg>
        </aside>

        <section className="flex w-full items-center justify-center bg-white px-6 py-10 sm:px-10 lg:w-1/2 lg:px-16 xl:px-24">
          <div className="w-full max-w-[460px] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-3 duration-700">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Welcome Back</p>
              <h2 className={`${playfair.className} mt-2 text-4xl text-[#0F172A]`}>Sign in</h2>
              <p className="mt-2 text-sm text-slate-500">Masuk untuk melanjutkan pengelolaan operasional toko jahit.</p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.32)] sm:p-8"
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-600">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11 border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#0F172A]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-600">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11 border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#0F172A]/20"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
                )}

                <Button
                  type="submit"
                  className="h-11 w-full bg-[#0F172A] text-white hover:bg-[#1E293B]"
                  disabled={isLoading}
                >
                  {isLoading ? "Memproses..." : "Masuk ke Dashboard"}
                </Button>
              </div>
            </form>

            <p className="mt-5 text-center text-xs text-slate-400">
              By continuing, you agree to operational security and data governance policy.
            </p>
          </div>
        </section>
      </section>

      <section className="bg-[#0F172A] px-6 py-12 text-white lg:hidden">
        <div className="mx-auto max-w-lg">
          <h3 className={`${playfair.className} text-2xl`}>Tailor Management System</h3>
          <p className="mt-2 text-sm text-slate-300">Kelola semua proses jahitan dari order sampai selesai, cepat dan rapi.</p>
        </div>
      </section>
    </main>
  );
}
