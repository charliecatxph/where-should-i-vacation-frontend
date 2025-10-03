import { authGate } from "@/authentication/authGate";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Check } from "lucide-react";
import { GetServerSidePropsContext } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";

type ProductCode = "explorer" | "journeyman";
type VerifyStripeResponse = { itemCode: ProductCode };

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const udc = await authGate(ctx);
  return udc;
};

export default function PurchaseSuccess({ user, queries, api }: any) {
  const router = useRouter();
  const { data, isSuccess, isLoading, isError } =
    useQuery<VerifyStripeResponse>({
      queryKey: ["purchase", queries.session_id.trim()],
      queryFn: async () => {
        const res = await axios.post(
          `${api}/verify-stripe`,
          {
            session_id: queries.session_id.trim(),
          },
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        return res.data;
      },
      enabled: Boolean(queries.session_id.trim() && user.token),
      retry: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 0,
    });

  useEffect(() => {
    if (isError) router.replace("/");
  }, [isError, router]);

  const isColorful = Boolean(isSuccess && data?.itemCode);
  const isExplorer = data?.itemCode === "explorer";
  const isJourneyman = data?.itemCode === "journeyman";
  const itemLabel = isExplorer ? "Explorer" : isJourneyman ? "Journeyman" : "";

  const mainBgClass = isColorful
    ? isExplorer
      ? "bg-gradient-to-b from-orange-50 to-white"
      : "bg-gradient-to-b from-blue-50 to-white"
    : "bg-gradient-to-b from-neutral-100 to-white";

  const blobTopClass = isColorful
    ? isExplorer
      ? "bg-orange-200/40"
      : "bg-blue-200/40"
    : "bg-neutral-200/40";

  const blobBottomClass = isColorful
    ? isExplorer
      ? "bg-orange-300/30"
      : "bg-blue-300/30"
    : "bg-neutral-300/30";

  const headingGradientClass = isExplorer
    ? "from-orange-600 via-orange-500 to-amber-500"
    : "from-blue-600 via-blue-500 to-sky-500";

  const buttonColorClass = isExplorer
    ? "bg-orange-600 hover:bg-orange-700 focus-visible:ring-orange-400 shadow-orange-600/20"
    : "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-400 shadow-blue-600/20";

  return (
    <>
      <Head>
        <title>Purchase | Where Should I Vacation</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
        className={`relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16 ${mainBgClass}`}
      >
        <div className="pointer-events-none absolute inset-0">
          <div
            className={`animate-blob-slow absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl ${blobTopClass}`}
          />
          <div
            className={`animate-blob-slower absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl ${blobBottomClass}`}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-2xl text-center">
          {isLoading && (
            <div
              className="flex flex-col items-center animate-fade-up"
              style={{ animationDelay: "120ms" }}
            >
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-neutral-500">
                Verifying
              </p>
              <div className="mb-4 h-10 w-10 rounded-full border-2 border-neutral-300 border-t-transparent animate-spin" />
              <p className="mt-1 text-base text-neutral-600 sm:text-lg">
                Verifying your purchase...
              </p>
            </div>
          )}

          {isSuccess && data && (
            <div className="flex flex-col items-center">
              <h1
                className={`animate-fade-up bg-gradient-to-r ${headingGradientClass} bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl`}
                style={{ animationDelay: "160ms" }}
              >
                Thank you for purchasing {itemLabel}!
              </h1>
              <p
                className="animate-fade-up mt-4 text-balance text-base text-neutral-600 sm:text-lg"
                style={{ animationDelay: "240ms" }}
              >
                {itemLabel === "Explorer"
                  ? "Your journey is just beginning, and we can’t wait to help you uncover new places, hidden gems, and unforgettable moments."
                  : "You’re not just traveling — you’re mastering the art of the journey. We’re excited to be your guide on every step of this adventure."}
              </p>

              <div
                className="animate-fade-up mt-8 flex items-center justify-center gap-4"
                style={{ animationDelay: "360ms" }}
              >
                <Link
                  href="/"
                  className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-white shadow-lg transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${buttonColorClass}`}
                >
                  Back to home
                </Link>
              </div>

              <div
                className="animate-fade-up mt-10 text-xs text-black"
                style={{ animationDelay: "480ms" }}
              >
                <span className="px-5 py-1.5 bg-neutral-200/20 border-1 border-neutral-200 rounded-full flex gap-2 items-center font-[500]">
                  <Check size="15" strokeWidth={3} color="green" /> Verified by
                  <img src="stripe.png" alt="" className="h-[15px]" />
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
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
