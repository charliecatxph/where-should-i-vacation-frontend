import { handleAxiosError } from "@/functions/handleAxiosError";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import {
  Calendar,
  CircleQuestionMark,
  Cloud,
  Eye,
  Lightbulb,
  MapPin,
  Search,
  Sparkles,
  Thermometer,
  Wind,
} from "lucide-react";
import { Geist, Inter } from "next/font/google";
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
import Head from "next/head";
import moment from "moment";
const inter = Inter({ subsets: ["latin"] });
const geist = Geist({ subsets: ["latin"] });

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

  const {
    data: travelRecommendations,
    error: travelRecommendationsError,
    isFetching,
  } = useQuery({
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
  const interpretationDuration = interpretationWords.length * 0.01; // stagger * words + last word duration

  // Interpolate color from green (0) to red (5) for population density
  function getDensityColor(density: number) {
    const value = Math.max(0, Math.min(5, density));
    const hue = 120 - 120 * (value / 5); // 120 (green) to 0 (red)
    return `hsl(${hue}, 80%, 45%)`;
  }

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
    { name: "Generation History", route: "/history" },
  ];

  // --- SKELETONS FOR AI SUMMARY ---
  const TripOverviewSkeleton = () => (
    <div className="col-span-2 bg-neutral-100 px-7 py-5 rounded-lg shadow-sm shadow-neutral-100 border-1 border-neutral-300">
      <div className="h-6 w-1/4 rounded mb-5 loading-skeleton" />
      <div className="cards flex gap-20 mt-5">
        {[1].map((_, i) => (
          <div key={i} className="flex gap-5 items-center w-max">
            <div className="w-7 h-7 rounded-full loading-skeleton" />
            <div>
              <div className="h-4 w-20 rounded mb-1 loading-skeleton" />
              <div className="h-5 w-24 rounded loading-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const WeatherForecastSkeleton = () => (
    <div className="bg-neutral-100 px-7 py-5 rounded-lg shadow-sm shadow-neutral-100 border-1 border-neutral-300">
      <div className="h-6 w-1/3 rounded mb-5 loading-skeleton" />
      <div className="flex justify-center gap-10 flex-col h-full">
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="h-8 w-16 rounded loading-skeleton" />
            <div className="h-6 w-20 rounded loading-skeleton" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-4 w-24 rounded loading-skeleton" />
            <div className="h-4 w-16 rounded loading-skeleton" />
          </div>
        </div>
        <div className="grid grid-cols-2 mt-2 gap-2">
          <div className="h-4 w-32 rounded loading-skeleton" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-28 rounded loading-skeleton" />
            <div className="h-4 w-20 rounded loading-skeleton" />
          </div>
        </div>
      </div>
    </div>
  );

  const TravelInsightsSkeleton = () => (
    <div className="bg-neutral-100 px-7 py-5 rounded-lg shadow-sm shadow-neutral-100 border-1 border-neutral-300">
      <div className="h-6 w-1/3 rounded mb-5 loading-skeleton" />
      <div className="mt-3">
        <div className="flex justify-between items-center mb-2">
          <div className="h-5 w-24 rounded loading-skeleton" />
          <div className="h-6 w-16 rounded loading-skeleton" />
        </div>
        <div className="h-4 w-40 rounded mb-3 loading-skeleton" />
        <div className="h-5 w-32 rounded mt-5 mb-2 loading-skeleton" />
        <div className="h-4 w-40 rounded loading-skeleton" />
      </div>
    </div>
  );

  // --- ANIMATION VARIANTS FOR SUMMARY CARDS ---
  const summaryCardsContainerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.18,
      },
    },
  };
  const summaryCardVariants = {
    hidden: { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    },
  };

  return (
    <>
      <Head>
        <title>{travelRecommendations?.title ?? "Generating..."}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${inter.className} relative`}>
        <Header
          userData__final={userData__final}
          navButtons={navButtons}
          api={api}
        />
        <section className="ai-summary">
          <div className="ctx-container">
            <div className="wrapper mt-10 px-5">
              <h1 className="font-[600] text-2xl">
                {isFetching ? (
                  <span className="h-7 w-1/2 rounded loading-skeleton inline-block" />
                ) : (
                  travelRecommendations?.title
                )}
              </h1>
              <p className="mt-1 font-[300] text-lg">
                {isFetching ? (
                  <span className="h-5 w-2/3 rounded loading-skeleton inline-block" />
                ) : (
                  travelRecommendations?.interpretation
                )}
              </p>
              <div className={`grid max-[800px]:grid-cols-1  grid-cols-2 mt-5 gap-5 ${geist.className}`}>
                {isFetching ? (
                  <>
                    <div className="col-span-2 max-[800px]:col-span-1">
                      <TripOverviewSkeleton />
                    </div>
                    <div className="max-[800px]:col-span-1">
                      <WeatherForecastSkeleton />
                    </div>
                    <div className="max-[800px]:col-span-1">
                      <TravelInsightsSkeleton />
                    </div>
                  </>
                ) : (
                  <motion.div
                    className={`contents`}
                    variants={summaryCardsContainerVariants}
                    initial="hidden"
                    animate="show"
                  >
                    <motion.div
                      className="col-span-2 max-[800px]:col-span-1 bg-neutral-100 px-7 py-5 rounded-lg shadow-sm shadow-neutral-100 border-1 border-neutral-300"
                      variants={summaryCardVariants}
                    >
                      <h1 className="font-[500] text-lg">Trip Overview</h1>
                      <div className="cards flex gap-20 mt-5 max-[800px]:flex-col max-[800px]:gap-5">
                        <div className="flex gap-5 items-center w-max">
                          <MapPin size={18} />
                          <div>
                            <p className="text-neutral-600 text-sm">
                              Destination
                            </p>
                            <p>{parameters?.where}</p>
                          </div>
                        </div>
                        <div className="flex gap-5 items-center w-max">
                          <Calendar size={18} />
                          <div>
                            <p className="text-neutral-600 text-sm">Dates</p>
                            <p>{parameters?.when ? `${moment(parameters?.when.split(" - ")[0].trim()).format("MMM D")} - ${moment(parameters?.when.split(" - ")[1].trim()).format("MMM D")}` : ""}</p>
                          </div>
                        </div>
                        <div className="flex gap-5 items-center w-max">
                          <Eye size={18} />
                          <div>
                            <p className="text-neutral-600 text-sm">
                              Experience
                            </p>
                            <p>{parameters?.what}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    <motion.div
                      className="bg-neutral-100 px-7 py-5 rounded-lg shadow-sm shadow-neutral-100 border-1 border-neutral-300"
                      variants={summaryCardVariants}
                    >
                      <h1 className="font-[500] text-lg flex items-center gap-5">
                        <Thermometer size={18} /> Weather Forecast
                      </h1>
                      <div className="flex justify-center gap-10 flex-col mt-5">
                        <div>
                          <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-[600]">
                              {
                                travelRecommendations?.extras.expected_weather
                                  .temperature.max_c
                              }
                              °C
                            </h1>{" "}
                            <div className="bg-orange-600 text-white text-center px-5 py-1 text-xs rounded-lg font-[500]">
                              {
                                travelRecommendations?.extras.expected_weather
                                  .condition
                              }
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-neutral-600">
                              Feels like{" "}
                              {
                                travelRecommendations?.extras.expected_weather
                                  .temperature.feels_like_c
                              }
                              °C
                            </p>{" "}
                            <p className="text-right text-neutral-600">
                              UV Index:{" "}
                              {
                                travelRecommendations?.extras.expected_weather
                                  .uv_index
                              }
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 max-[550px]:grid-cols-1 gap-5">
                          <p className="text-neutral-600 text-sm">
                            {
                              travelRecommendations?.extras.expected_weather
                                .details
                            }
                          </p>
                          <div className="flex flex-col justify-center">
                            <p className="flex gap-3 items-center text-neutral-600 text-sm">
                              <Cloud size={18} />{" "}
                              {
                                travelRecommendations?.extras.expected_weather
                                  .humidity_percent
                              }
                              % expected humidity
                            </p>
                            <p className="flex gap-3 items-center text-neutral-600 text-sm">
                              <Wind size={18} />{" "}
                              {
                                travelRecommendations?.extras.expected_weather
                                  .wind.speed_kph
                              }{" "}
                              kph
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    <motion.div
                      className="bg-neutral-100 px-7 py-5 rounded-lg shadow-sm shadow-neutral-100 border-1 border-neutral-300"
                      variants={summaryCardVariants}
                    >
                      <h1 className="font-[500] text-lg flex items-center gap-5">
                        <Lightbulb size={18} /> Travel Insights
                      </h1>
                      <div className="mt-3">
                        <div className="flex justify-between items-center">
                          <h1 className="font-[500]">Crowd Density</h1>
                          <p
                            className="text-white px-5 py-1 text-xs rounded-lg font-[500]"
                            style={{
                              background: getDensityColor(
                                travelRecommendations?.extras.p_density
                              ),
                            }}
                          >
                            {travelRecommendations?.extras.p_density} / 5
                          </p>
                        </div>
                        <p className="text-sm mt-2 text-neutral-600">
                          {travelRecommendations?.extras.p_density_expl}
                        </p>
                        <h1 className="font-[500] mt-5">Transportation Tip</h1>
                        <p className="text-sm mt-1 text-neutral-600">
                          {travelRecommendations?.extras.tr_advice}
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
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
                              dates={parameters?.when}
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
