import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-orange-50 to-white px-6 py-16">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl animate-blob-slow" />
          <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-orange-300/30 blur-3xl animate-blob-slower" />
        </div>

        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <Image
            src="/wta.svg"
            alt="WhereTo AI"
            width={100}
            height={40}
            priority
            className="mx-auto mb-6 animate-fade-down"
          />

          <p
            className="mb-2 text-sm font-semibold uppercase tracking-widest text-orange-600 animate-fade-up"
            style={{ animationDelay: "80ms" }}
          >
            Oops!
          </p>
          <h1
            className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-7xl font-extrabold text-transparent sm:text-8xl animate-fade-up"
            style={{ animationDelay: "160ms" }}
          >
            404
          </h1>
          <p
            className="mt-4 text-balance text-base text-neutral-600 sm:text-lg animate-fade-up"
            style={{ animationDelay: "240ms" }}
          >
            The page you’re looking for doesn’t exist or may have moved.
          </p>

          <div
            className="mt-8 flex items-center justify-center gap-4 animate-fade-up"
            style={{ animationDelay: "360ms" }}
          >
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-orange-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-0.5 hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
            >
              Back to home
            </Link>
          </div>

          <div
            className="mt-10 text-xs text-neutral-400 animate-fade-up"
            style={{ animationDelay: "480ms" }}
          >
            Error code: 404
          </div>
        </div>
      </main>

      {/* Page-scoped animations */}
      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes fadeDown {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes blobFloat {
          0% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(20px, -10px) scale(1.05);
          }
          66% {
            transform: translate(-12px, 12px) scale(0.98);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }
        .animate-fade-up {
          animation: fadeUp 600ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
        }
        .animate-fade-down {
          animation: fadeDown 600ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
        }
        .animate-blob-slow {
          animation: blobFloat 14s ease-in-out infinite;
        }
        .animate-blob-slower {
          animation: blobFloat 20s ease-in-out infinite;
          animation-delay: -2s;
        }
      `}</style>
    </>
  );
}
