import { handleAxiosError } from "@/functions/handleAxiosError";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import {
  Calendar,
  CircleQuestionMark,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";
import { Inter } from "next/font/google";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  decrementGenerationCredits,
  isUserDataComplete,
  selectUserData,
  setUser,
  UserState,
} from "@/redux/features/user";
import { useDispatch, useSelector } from "react-redux";
import PlaceCard, { PlaceCardSkeleton } from "@/components/generate";
import { GetServerSidePropsContext } from "next";
import { authGate } from "@/authentication/authGate";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { useModal } from "@/components/modals/ModalContext";
const inter = Inter({ subsets: ["latin"] });

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const udc = await authGate(ctx);
  return udc;
};

export interface PlacePhoto {
  authorAttributions: {
    displayName: string;
    photoUri: string;
    uri: string;
  };
  public_id: string;
  secure_url: string;
}

export interface RecommendedPlace {
  cached: boolean;
  displayName: {
    text: string;
    languageCode?: string;
  };
  formattedAddress: string;
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  name: string;
  photoCount: number;
  photos: PlacePhoto[];
}

export interface TravelRecommendations {
  interpretation: string;
  places: RecommendedPlace[];
  title: string;
}

export default function Generate({ user, queries, api }: any) {
  const { showParameterError, showCreditError } = useModal();
  const dispatch = useDispatch();
  const userData = useSelector(selectUserData);

  // ---- USER DATA REDUX CONDITIONAL ---
  const userData__final = isUserDataComplete(userData) ? userData : user;
  useEffect(() => {
    if (!user) return;
    dispatch(setUser(user));
  }, [user]);

  const router = useRouter();
  const [parameters, setParameters] = useState({
    what: "",
    where: "",
    when: "",
    uuid: "",
  });
  const [showCards, setShowCards] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    const { what = "", where = "", when = "", uuid = "" } = queries;

    if (typeof uuid !== "string" || !uuid.trim()) {
      router.push("/");
    }

    setParameters({
      what: (what as string).trim(),
      where: (where as string).trim(),
      when: (when as string).trim(),
      uuid: (uuid as string).trim(),
    });
  }, [router]);

  const { data: travelRecommendations, error: travelRecommendationsError } =
    useQuery({
      queryKey: ["travel-recommendations", queries.uuid],
      queryFn: async () => {
        const params = new URLSearchParams({
          uuid: parameters.uuid,
          what: parameters.what,
          where: parameters.where,
          when: parameters.when,
        });
        const res = await axios.get(
          `${api}/get-travel-recommendations?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
            withCredentials: true,
            timeout: 120000,
          }
        );

        if (!res.data.cached) {
          dispatch(decrementGenerationCredits());
        }

        if (res.data.userQuery) {
          setParameters((pv) => ({
            ...pv,
            ...res.data.userQuery,
          }));
        }
        return res.data;
      },
      refetchOnReconnect: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 60 * 60 * 1000,
      retry: 1,
      enabled: Boolean(queries.uuid && user.token),
    });

  useEffect(() => {
    if (!travelRecommendationsError) return;
    const wtaError = handleAxiosError(travelRecommendationsError as AxiosError);
    if (
      [
        "USER_NOT_EXIST",
        "SERVER_ERROR",
        "USER_GENERATION_ID_MISMATCH",
      ].includes(wtaError)
    ) {
      router.replace("/");
      return;
    }

    if (wtaError === "PARAMETERS_INCOMPLETE") {
      showParameterError();
      return;
    }

    if (wtaError === "RAN_OUT_OF_CREDITS") {
      showCreditError();
      return;
    }
  }, [travelRecommendationsError]);

  const interpretationWords = travelRecommendations?.interpretation
    ? travelRecommendations.interpretation.split(" ")
    : [];

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.05 } },
  };

  const cardsContainerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.4 } },
  };

  // Calculate the total duration of the interpretation animation
  const interpretationDuration = interpretationWords.length * 0.03; // stagger * words + last word duration

  useEffect(() => {
    if (interpretationWords.length > 0) {
      setShowCards(false);
      const timeout = setTimeout(() => {
        setShowCards(true);
      }, interpretationDuration * 1000);
      return () => clearTimeout(timeout);
    } else {
      setShowCards(true);
    }
  }, [travelRecommendations?.interpretation]);

  const navButtons = [
    { name: "Add Credits", route: "/#pricing" },
    { name: "Itinerary Builder", route: "/itinerary-builder" },
    { name: "Generation History", route: "/history" },
  ];

  return (
    <>
      <main className={`${inter.className} relative`}>
        <Header
          userData__final={userData__final}
          navButtons={navButtons}
          api={api}
        />
        <section>
          <div className="ctx-container">
            <div className="wrapper px-5">
              <div className="prompt-summary">
                <h1 className="font-[600] text-2xl mt-10">
                  {travelRecommendations?.title || ""}
                </h1>
                <div className="ai-interpretation bg-blue-300/20 w-full px-7 py-5 shadow-sm shadow-neutral-50 rounded-lg mt-5">
                  <div className="flex gap-3 items-center text-blue-700 font-[600] text-sm">
                    <Search size={15} />
                    <h1>Your Search</h1>
                  </div>
                  <div className="you-have-entered flex gap-2 items-center pt-5 max-[700px]:flex-col max-[700px]:items-start">
                    <div className="flex gap-2 flex-1">
                      <CircleQuestionMark size={22} />
                      <div>
                        <h1 className="">What?</h1>
                        <p className=" font-[600]">
                          {queries?.what ?? parameters.what}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-1">
                      <Calendar size={22} />
                      <div>
                        <h1 className="">When?</h1>
                        <p className=" font-[600]">
                          {queries?.when ?? parameters.when}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-1">
                      <MapPin size={22} />
                      <div>
                        <h1 className="">Where?</h1>
                        <p className=" font-[600]">
                          {queries?.where ?? parameters.where}
                        </p>
                      </div>
                    </div>
                  </div>
                  {travelRecommendations?.interpretation ? (
                    <div className="final-ai-interpretation p-5 bg-slate-50 mt-5 rounded-lg text-sm">
                      <div className="flex gap-2 items-center  font-[500] text-blue-600">
                        <Sparkles size={20} />
                        <h1>AI Interpretation</h1>
                      </div>
                      <motion.p
                        className="ml-[28px] mt-1 text-blue-600"
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.25em",
                        }}
                      >
                        {interpretationWords.map((word: string, i: number) => (
                          <motion.span key={i} variants={wordVariants}>
                            {word}
                          </motion.span>
                        ))}
                      </motion.p>
                    </div>
                  ) : (
                    <div className="loading-ai-interpretation p-5 bg-slate-50 mt-5 rounded-lg text-sm">
                      <div className="flex gap-2 items-center  font-[500] text-blue-600">
                        <Sparkles size={20} />
                        <h1>AI Interpretation</h1>
                      </div>
                      <div className="skeleton ml-[28px] flex flex-col gap-2 mt-2">
                        <div className="flex gap-2">
                          <div className="loading-skeleton h-[15px] rounded-full w-2/3"></div>
                          <div className="loading-skeleton h-[15px] rounded-full w-1/3"></div>
                        </div>
                        <div className="row-1 flex gap-2">
                          <div className="loading-skeleton h-[15px] rounded-full w-1/4"></div>
                          <div className="loading-skeleton h-[15px] rounded-full w-1/4"></div>
                          <div className="loading-skeleton h-[15px] rounded-full w-1/2"></div>
                        </div>
                        <div className="row-1 flex gap-2">
                          <div className="loading-skeleton h-[15px] rounded-full w-1/3"></div>
                          <div className="loading-skeleton h-[15px] rounded-full w-2/3"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="gcp-results mb-10">
          <div className="ctx-container">
            <div className="wrapper px-5">
              {showCards && travelRecommendations?.places && (
                <>
                  <h1 className="mt-5 font-[600] text-xl">
                    Places to check out
                  </h1>
                  <p className="text-neutral-700 mt-1">
                    Personally catered, for you.
                  </p>
                </>
              )}

              {showCards && (
                <motion.div
                  className="cards grid grid-cols-1 md:grid-cols-2 gap-3 mt-8"
                  variants={cardsContainerVariants}
                  initial="hidden"
                  animate="show"
                >
                  {!travelRecommendations ||
                  travelRecommendations.places.length === 0
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <PlaceCardSkeleton key={i} />
                      ))
                    : travelRecommendations.places.map(
                        (place: RecommendedPlace, i: number) => {
                          return (
                            <motion.div key={i} variants={cardVariants}>
                              <PlaceCard
                                images={place.photos.map((photo: any) => ({
                                  url: photo.secure_url,
                                  author:
                                    photo.authorAttributions[0].displayName,
                                }))}
                                id={place.id}
                                name={place.displayName.text}
                                location={place.formattedAddress}
                                mapsUrl={`https://www.google.com/maps/place/?q=place_id:${place.id}`}
                                placeUrl="https://www.example.com/alps-lodge"
                              />
                            </motion.div>
                          );
                        }
                      )}
                </motion.div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
