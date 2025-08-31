import { authGate } from "@/authentication/authGate";
import { Header } from "@/components/Header";
import {
  isUserDataComplete,
  selectUserData,
  setUser,
  UserState,
} from "@/redux/features/user";
import { GetServerSidePropsContext } from "next";
import { Inter } from "next/font/google";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CircularProgress } from "@mui/material";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Calendar,
  ChevronRight,
  CircleQuestionMark,
  MapPin,
  Star,
} from "lucide-react";
import { useRouter } from "next/router";
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const udc = await authGate(ctx);
  return udc;
};

function GenerationCardSkeleton() {
  return (
    <div className="bg-white border border-neutral-100 rounded-lg shadow-md shadow-neutral-50 transition-shadow p-5 mb-4 flex flex-col gap-3 animate-pulse">
      <div className="flex items-center justify-between">
        <span className="h-6 w-1/3 bg-neutral-200 rounded-full" />
        <span className="h-3 w-12 bg-neutral-200 rounded-full" />
      </div>
      <div className="flex flex-col gap-2 mt-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-5 w-5 bg-neutral-200 rounded-full" />
            <span className="h-4 w-20 bg-neutral-200 rounded-full" />
            <span className="h-4 w-32 bg-neutral-100 rounded-full flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

function timeAgo(date: { _seconds: number; _nanoseconds: number }) {
  const now = Date.now();
  const created = date._seconds * 1000;
  const diff = Math.floor((now - created) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  const d = new Date(created);
  return d.toLocaleDateString();
}

function GenerationCard({
  generation,
  onClick,
}: {
  generation: any;
  onClick: () => void;
}) {
  return (
    <div
      className="bg-white border border-neutral-100 rounded-lg shadow-md hover:shadow-lg shadow-neutral-50 transition-shadow p-5 mb-4 flex flex-col gap-3 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-orange-600 flex items-center gap-2 max-w-[80%] truncate">
          {generation.itinerary_title}
          <ChevronRight
            size={20}
            strokeWidth={2}
            className="text-orange-500 max-[800px]:hidden"
          />
        </span>
        <span className="text-xs text-neutral-500">
          {timeAgo(generation.created_at)}
        </span>
      </div>
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex items-center gap-2 text-neutral-700">
          <span className="font-normal text-neutral-700">
            {generation.description}
          </span>
        </div>

        <div className="flex items-center gap-2 text-neutral-700">
          <Star size={18} className="text-yellow-400" />
          <span className="font-semibold text-neutral-900">Day/s Count:</span>
          <span className="font-normal text-neutral-700">
            {generation.schedule.length} day
            {generation.schedule.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function History({ user, api }: any) {
  const dispatch = useDispatch();
  const router = useRouter();
  const userData = useSelector(selectUserData);

  // ---- USER DATA REDUX CONDITIONAL ---
  const userData__final = isUserDataComplete(userData) ? userData : user;
  useEffect(() => {
    if (!user) return;
    dispatch(setUser(user));
  }, [user]);

  const {
    data: generationHistory = [],
    isFetching,
    isFetched,
    isLoading,
    isSuccess,
    error,
  } = useQuery({
    queryKey: ["itinerary-history", user.id],
    queryFn: async () => {
      const res = await axios.get(`${api}/get-itinerary-history`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        withCredentials: true,
      });
      return res.data.generations as any[];
    },
    enabled: isUserDataComplete(user),
    refetchOnMount: "always",
  });

  const navButtons = [
    { name: "Generation", route: "/" },
  ];

  return (
    <>
      <Head>
        <title>Itinerary History | Where Should I Vacation</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${inter.className} relative`}>
        <Header
          userData__final={userData__final}
          navButtons={navButtons}
          api={api}
        />
        <section className="history">
          <div className="ctx-container">
            <div className="wrapper">
              <h1 className="text-3xl font-[800] text-center mt-10">
                Itinerary History
              </h1>
              <p className="text-center font-[500] text-neutral-700 mt-1">
                Your previous itinerary generations.
              </p>
              <div className="history-list mt-5 px-5">
                {isLoading &&
                  generationHistory.length === 0 &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <GenerationCardSkeleton key={i} />
                  ))}

                {isSuccess && generationHistory.length === 0 && (
                  <div className="text-center text-neutral-500 py-10">
                    <span className="text-4xl block mb-2">🗂️</span>
                    <span className="text-lg font-medium">No history yet</span>
                    <div className="text-sm mt-2">
                      Your generated vacations will appear here.
                    </div>
                  </div>
                )}

                {isSuccess &&
                  generationHistory.length > 0 &&
                  generationHistory?.map((generation: any, i) => (
                    <GenerationCard
                      key={i}
                      generation={generation}
                      onClick={() =>
                        router.push(`/generate-itinerary?uuid=${generation.id}`)
                      }
                    />
                  ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
