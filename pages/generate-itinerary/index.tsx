import { authGate } from "@/authentication/authGate";
import { Header } from "@/components/Header";
import {
  decrementItineraryCredits,
  isUserDataComplete,
  selectUserData,
  setUser,
} from "@/redux/features/user";
import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CircularProgress } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/Footer";
import { ArrowUpRight, Cloud, Lightbulb, MapPin, Share, Thermometer, Wind } from "lucide-react";
import AviasalesCard from "@/components/vacation/AviasalesCard";
import { handleAxiosError } from "@/functions/handleAxiosError";
import { useModal } from "@/components/modals/ModalContext";
import Link from "next/link"
import Head from "next/head";

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const udc = await authGate(ctx);
  return udc;
};

interface Coordinate {
  latitude: number;
  longitude: number;
}

const getSphericalCenter = (coords: Coordinate[]): Coordinate => {
  let x = 0,
    y = 0,
    z = 0;

  coords.forEach(({ latitude, longitude }) => {
    const latRad = (latitude * Math.PI) / 180;
    const lngRad = (longitude * Math.PI) / 180;

    x += Math.cos(latRad) * Math.cos(lngRad);
    y += Math.cos(latRad) * Math.sin(lngRad);
    z += Math.sin(latRad);
  });

  const total = coords.length;
  x /= total;
  y /= total;
  z /= total;

  const hyp = Math.sqrt(x * x + y * y);
  const latRad = Math.atan2(z, hyp);
  const lngRad = Math.atan2(y, x);

  return {
    latitude: (latRad * 180) / Math.PI,
    longitude: (lngRad * 180) / Math.PI,
  };
};

// Beautiful loading skeleton component with progress indicators
const ItineraryLoadingSkeleton = ({ isLoading, isSuccess }: {
  isLoading: boolean;
  isSuccess: boolean;
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const steps = [
    { text: "Analyzing your preferences...", duration: 20000 },
    { text: "Finding the perfect locations...", duration: 35000 },
    { text: "Curating unique experiences...", duration: 30000 },
    { text: "Optimizing your schedule...", duration: 25000 },
    { text: "Cross-referencing with local insights...", duration: 20000 },
    { text: "Adding final touches...", duration: 30000 },
  ];

  useEffect(() => {
    if (!isLoading) return;

    const totalDuration = 160000; // 2.67 minutes
    const stepDuration = totalDuration / steps.length;

    // Progress animation - stop at 95% until real data arrives
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95; // Stop at 95% until real data arrives
        return prev + (95 / (totalDuration / 100));
      });
    }, 100);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) return steps.length - 1;
        return prev + 1;
      });
    }, stepDuration);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [isLoading]);

  // Jump to 100% when data arrives
  useEffect(() => {
    if (isSuccess && progress > 0) {
      setProgress(100);
      setCurrentStep(steps.length - 1);

      // Pause briefly then hide skeleton and show results
      const timer = setTimeout(() => {
        setShowResults(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, progress]);

  if (showResults) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full py-8 max-[500px]:py-4"
    >
      {/* Header Skeleton */}
      <motion.div
        className="flex justify-between mt-5 mb-8 max-[800px]:flex-col max-[800px]:gap-4 max-[500px]:mt-2 max-[500px]:mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-col gap-3">
          <div className="h-8 w-80 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded-lg animate-pulse max-[800px]:w-64 max-[500px]:w-full max-[500px]:h-6" />
          <div className="h-1 w-20 bg-orange-600 rounded-full max-[500px]:w-16" />
          <div className="h-4 w-48 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse max-[800px]:w-40 max-[500px]:w-full max-[500px]:h-3" />
          <div className="h-4 w-96 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse max-[800px]:w-64 max-[500px]:w-full max-[500px]:h-3" />
        </div>
      </motion.div>

      {/* Progress Section */}
      <motion.div
        className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-8 mb-8 max-[800px]:p-6 max-[500px]:p-4 max-[500px]:mb-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col items-center gap-6 max-[500px]:gap-4">
          <div className="relative">
            <CircularProgress
              size={60}
              thickness={3}
              sx={{
                color: '#ea580c',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                }
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold text-orange-700 max-[500px]:text-xs">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          <div className="text-center">
            <motion.h3
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-semibold text-orange-800 mb-2 max-[800px]:text-lg max-[500px]:text-base max-[500px]:mb-1"
            >
              {steps[currentStep]?.text}
            </motion.h3>
            <p className="text-orange-600 text-sm max-[500px]:text-xs">
              This usually takes about 2-3 minutes. Hang tight! ✨
            </p>
            <p className="text-orange-600 text-sm max-[500px]:text-xs">
              Long itineraries take longer to create.
            </p>
            <p className="text-orange-600 text-xs mt-2 flex gap-5 items-center max-[800px]:flex-col max-[800px]:gap-2 max-[500px]:text-xs">
              Your itineraries can be viewed in <Link href="/itinerary-history"><span className="block px-5 py-2 bg-white rounded-lg text-black font-[500] flex items-center gap-2 max-[500px]:px-3 max-[500px]:py-1.5 max-[500px]:text-xs"><MapPin className="text-blue-600" size={15} />{" "}Itinerary History</span></Link>.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md bg-orange-200 rounded-full h-2 max-[500px]:max-w-full">
            <motion.div
              className="bg-orange-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Day Selector Skeleton */}
      <motion.div
        className="mb-8 max-[500px]:mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex gap-2 bg-neutral-50 rounded-xl p-1 border border-neutral-100 max-[600px]:grid max-[600px]:grid-cols-2 max-[400px]:grid-cols-1">
          {[1, 2, 3, 4].map((day) => (
            <div
              key={day}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded-lg animate-pulse h-10 max-[600px]:flex-none max-[500px]:h-8"
            />
          ))}
        </div>
      </motion.div>

      {/* Places Skeleton */}
      <motion.div
        className="mb-8 max-[500px]:mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="h-6 w-20 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded mb-4 animate-pulse max-[500px]:h-5 max-[500px]:w-16 max-[500px]:mb-3" />
        <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1 max-[500px]:gap-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <motion.div
              key={item}
              className="rounded-xl border border-neutral-200 overflow-hidden shadow-sm max-[500px]:rounded-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * item }}
            >
              <div className="h-44 w-full bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-200 animate-pulse max-[800px]:h-36 max-[500px]:h-32" />
              <div className="p-4 space-y-3 max-[500px]:p-3 max-[500px]:space-y-2">
                <div className="h-4 w-3/4 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse max-[500px]:h-3" />
                <div className="h-3 w-1/2 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse max-[500px]:h-2.5" />
                <div className="h-3 w-full bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse max-[500px]:h-2.5" />
                <div className="h-3 w-2/3 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse max-[500px]:h-2.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Hotels Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="h-6 w-16 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded mb-4 animate-pulse max-[500px]:h-5 max-[500px]:w-14 max-[500px]:mb-3" />
        <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1 max-[500px]:gap-3">
          {[1, 2, 3].map((item) => (
            <motion.div
              key={item}
              className="rounded-xl border border-neutral-200 overflow-hidden shadow-sm max-[500px]:rounded-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * item }}
            >
              <div className="h-40 w-full bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-200 animate-pulse max-[800px]:h-32 max-[500px]:h-28" />
              <div className="p-4 space-y-3 max-[500px]:p-3 max-[500px]:space-y-2">
                <div className="h-4 w-3/4 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse max-[500px]:h-3" />
                <div className="h-3 w-1/2 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse max-[500px]:h-2.5" />
                <div className="flex justify-between items-center">
                  <div className="h-4 w-24 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse max-[500px]:h-3 max-[500px]:w-20" />
                  <div className="h-8 w-16 bg-gradient-to-r from-orange-200 via-orange-100 to-orange-200 rounded animate-pulse max-[500px]:h-6 max-[500px]:w-12" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function GenerateItinerary({ user, queries, api }: any) {
  const { showParameterError, showCreditError, showNtlCreditError } = useModal();
  const router = useRouter();
  const dispatch = useDispatch();
  const userData = useSelector(selectUserData);
  // ---- USER DATA REDUX CONDITIONAL ---
  const userData__final = isUserDataComplete(userData) ? userData : user;
  useEffect(() => {
    if (!user) return;
    dispatch(setUser(user));
  }, [user]);

  const [parameters, setParameters] = useState({
    what: "",
    preferences: "",
    where: "",
    when: "",
    uuid: "",
  });

  useEffect(() => {
    if (!router.isReady) return;

    const {
      what = "",
      where = "",
      when = "",
      uuid = "",
      preferences = "",
    } = queries;

    if (typeof uuid !== "string" || !uuid.trim()) {
      router.push("/");
    }

    setParameters({
      what: (what as string).trim(),
      where: (where as string).trim(),
      when: (when as string).trim(),
      uuid: (uuid as string).trim(),
      preferences: (preferences as string).trim(),
    });
  }, [router]);

  const navButtons = [
    { name: "Generation", route: "/" },
    ...(user ? [{ name: "Itinerary History", route: "/itinerary-history" }] : []),
  ];

  const {
    data: itineraryData = null,
    isLoading,
    isError,
    isSuccess,
    error,
  } = useQuery({
    queryKey: ["itinerary-group", queries.uuid],
    queryFn: async () => {
      const params = new URLSearchParams({
        uuid: queries.uuid,
        what: queries.what,
        where: queries.where,
        when: queries.when,
        what_preferred: queries.preferences,
      });
      const res = await axios.get(
        `${api}/generate-itinerary?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token || ""}`,
          },
          withCredentials: true,
        }
      );

      if (!res.data?.cached) {
        dispatch(decrementItineraryCredits());
      }

      if (res.data?.cached) {
        setParameters(pv => ({
          ...pv,
          ...res.data.itinerary.userQuery
        }))
      }
      return res.data.itinerary?.[0] ?? res.data.itinerary;
    },
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 60 * 60 * 1000,
    retry: 1,
    enabled: Boolean(queries.uuid),
  });

  useEffect(() => {
    if (!error) return;
    const wtaError = handleAxiosError(error as AxiosError);
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

    if (wtaError === "NTL_USR_RAN_OUT_OF_CREDITS") {
      showNtlCreditError();
      return;
    }
  }, [error]);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  useEffect(() => {
    setSelectedDayIndex(0);
  }, [itineraryData]);

  const selectedDay = useMemo(() => {
    const schedule = itineraryData?.schedule ?? [];
    return schedule[selectedDayIndex] ?? null;
  }, [itineraryData, selectedDayIndex]);

  const sectionReveal = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };
  const listReveal = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  };
  const itemReveal = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  const [centralPoint, setCentralPoint] = useState<Coordinate>();

  useEffect(() => {
    if (!itineraryData) return;
    const pois: Coordinate[] = itineraryData.schedule.flatMap((day: any) =>
      day.activities.flatMap((activity: any) => {
        if (!activity.location?.latitude || !activity.location?.longitude) {
          return [];
        }
        return [
          {
            latitude: activity.location.latitude,
            longitude: activity.location.longitude,
          },
        ];
      })
    );
    setCentralPoint(getSphericalCenter(pois));
  }, [itineraryData]);

  const {
    data: hotelsData,
    isLoading: hotelsInitializing,
    isSuccess: hotelsSuccess,
    isError: hotelsError,
  } = useQuery({
    queryKey: ["itinerary-hotels", queries.uuid],
    queryFn: async () => {
      const res = await axios.get(
        `${api}/get-place-hotels?lat=${centralPoint?.latitude}&lng=${centralPoint?.longitude}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token || ""}`,
          },
        }
      );

      return res.data.hotels;
    },
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 60 * 60 * 1000,
    retry: 1,
    enabled: Boolean(
      queries.uuid &&
      centralPoint?.latitude &&
      centralPoint.longitude
    ),
  });

  function getDensityColor(density: number) {
    const value = Math.max(0, Math.min(5, density));
    const hue = 120 - 120 * (value / 5); // 120 (green) to 0 (red)
    return `hsl(${hue}, 80%, 45%)`;
  }

  return (
    <>
      <Head>
        <title>{itineraryData?.itinerary_title ?? "Generating..."}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Header
          userData__final={userData__final}
          navButtons={navButtons}
          api={api}
        />
        <section className="py-6">
          <div className="ctx-container">
            <div className="wrapper px-5">
              {/* Loading - only show if loading and no cached data */}
              {isLoading && !itineraryData && (
                <ItineraryLoadingSkeleton
                  isLoading={isLoading}
                  isSuccess={isSuccess}

                />
              )}

              {/* Error */}
              {isError && (
                <motion.div
                  variants={sectionReveal}
                  initial="hidden"
                  animate="show"
                  className="w-full bg-red-50 border border-red-200 text-red-700 rounded-lg p-4"
                >
                  <p className="font-semibold">Failed to load itinerary</p>
                  <p className="text-sm opacity-80 mt-1">
                    {(error as any)?.message ?? "Please try again shortly."}
                  </p>
                </motion.div>
              )}

              {/* Content */}
              {isSuccess && itineraryData && (
                <motion.div
                  className="flex flex-col gap-6"
                  variants={listReveal}
                  initial="hidden"
                  animate="show"
                >
                  {/* Header */}
                  <motion.div
                    className="flex justify-between  mt-5"
                    variants={itemReveal}
                  >
                    <div className="flex flex-col gap-1">
                      <h1 className="text-2xl md:text-3xl font-[800]">
                        {itineraryData.itinerary_title ?? "Your Itinerary"}
                      </h1>
                      <div className="h-1 w-20 bg-orange-600 rounded-full mt-1" />
                      <p className="text-neutral-600">
                        {itineraryData.general_location ?? ""}
                      </p>
                      {itineraryData.description && (
                        <p className="text-neutral-700 mt-2">
                          {itineraryData.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                  <motion.div
                    variants={itemReveal}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-80px" }}
                    className="w-full p-4 bg-orange-50 border-l-4 border-orange-400 text-orange-700 rounded-md shadow-sm"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">Beta Version</p>
                        <p className="text-sm mt-1">
                          This itinerary builder is currently in beta. If you encounter any issues, please contact us at{' '}
                          <a href="mailto:info@whereshouldivacation.com" className="font-medium underline hover:text-orange-800">
                            info@whereshouldivacation.com
                          </a>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                  <div className="grid grid-cols-2 mt-5 gap-5 max-[800px]:grid-cols-1 break-all">
                    <motion.div
                      className="bg-neutral-100 px-7 py-5 rounded-lg shadow-sm shadow-neutral-100 border-1 border-neutral-300"
                      variants={itemReveal}
                    >
                      <h1 className="font-[500] text-lg flex items-center gap-5">
                        <Thermometer size={18} /> Weather Forecast
                      </h1>
                      <div className="flex justify-center gap-10 flex-col mt-5">
                        <div>
                          <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-[600]">
                              {
                                itineraryData?.extras.expected_weather
                                  .temperature.max_c
                              }
                              °C
                            </h1>{" "}
                            <div className="bg-orange-600 text-white text-center px-5 py-1 text-xs rounded-lg font-[500]">
                              {
                                itineraryData?.extras.expected_weather
                                  .condition
                              }
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-neutral-600">
                              Feels like{" "}
                              {
                                itineraryData?.extras.expected_weather
                                  .temperature.feels_like_c
                              }
                              °C
                            </p>{" "}
                            <p className="text-right text-neutral-600">
                              UV Index:{" "}
                              {
                                itineraryData?.extras.expected_weather
                                  .uv_index
                              }
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 max-[550px]:grid-cols-1 gap-5">
                          <p className="text-neutral-600 text-sm">
                            {
                              itineraryData?.extras.expected_weather
                                .details
                            }
                          </p>
                          <div className="flex flex-col justify-center">
                            <p className="flex gap-3 items-center text-neutral-600 text-sm">
                              <Cloud size={18} />{" "}
                              {
                                itineraryData?.extras.expected_weather
                                  .humidity_percent
                              }
                              % expected humidity
                            </p>
                            <p className="flex gap-3 items-center text-neutral-600 text-sm">
                              <Wind size={18} />{" "}
                              {
                                itineraryData?.extras.expected_weather
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
                      variants={itemReveal}
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
                                itineraryData?.extras.p_density
                              ),
                            }}
                          >
                            {itineraryData?.extras.p_density} / 5
                          </p>
                        </div>
                        <p className="text-sm mt-2 text-neutral-600">
                          {itineraryData?.extras.p_density_expl}
                        </p>
                        <h1 className="font-[500] mt-5">Transportation Tip</h1>
                        <p className="text-sm mt-1 text-neutral-600">
                          {itineraryData?.extras.tr_advice}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Day selector */}
                  {Array.isArray(itineraryData.schedule) &&
                    itineraryData.schedule.length > 0 && (
                      <motion.div variants={itemReveal} className="w-full">
                        <div className="flex w-full gap-2  bg-neutral-50 rounded-xl p-1 border border-neutral-100 overflow-x-auto">
                          {itineraryData.schedule.map((d: any, idx: number) => (
                            <button
                              type="button"
                              key={idx}
                              onClick={() => setSelectedDayIndex(idx)}
                              className={`flex-1 basis-0 min-w-[110px] px-4 py-2 text-sm rounded-lg transition-colors border text-center ${idx === selectedDayIndex
                                ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                                : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                                }`}
                            >
                              Day {d.day ?? idx + 1}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                  {/* User warning */}
                  {itineraryData.user_warn &&
                    String(itineraryData.user_warn).trim() && (
                      <motion.div
                        variants={itemReveal}
                        className="w-full bg-orange-50 border border-orange-200 text-orange-800 rounded-lg p-4"
                      >
                        <p className="font-semibold">Heads up</p>
                        <p className="text-sm mt-1">
                          {itineraryData.user_warn}
                        </p>
                      </motion.div>
                    )}

                  {/* Places */}
                  <motion.div
                    className="flex flex-col gap-3"
                    variants={itemReveal}
                  >
                    <h2 className="text-xl font-[700]">Places</h2>
                    {selectedDay &&
                      Array.isArray(selectedDay.activities) &&
                      selectedDay.activities.length > 0 ? (
                      <motion.div
                        key={`day-${selectedDayIndex}`}
                        className="grid grid-cols-3 gap-4 max-[700px]:grid-cols-2 max-[500px]:grid-cols-1"
                        variants={listReveal}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-80px" }}
                      >
                        {selectedDay.activities.map(
                          (activity: any, idx: number) => {
                            const img =
                              activity.photos?.[0]?.secure_url ??
                              "/itinerary-ex.png";
                            return (
                              <motion.div
                                key={activity.id ?? idx}
                                className="rounded-xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                                variants={itemReveal}
                              >
                                <div className="relative h-44 w-full bg-neutral-100">
                                  <img
                                    src={img}
                                    alt={activity.displayName?.text ?? "Place"}
                                    className="w-full h-full object-cover"
                                  />
                                  {activity.timeInOut && (
                                    <span className="absolute top-2 left-2 text-xs bg-orange-600 text-white px-2 py-1 rounded-full bg-opacity-90">
                                      {activity.timeInOut}
                                    </span>
                                  )}
                                </div>
                                <div className="p-4 flex flex-col h-full justify-between">
                                 <div className="flex-col gap-2 flex">
                                 <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="font-semibold leading-tight">
                                        {activity.displayName?.text ??
                                          "Untitled"}
                                      </p>
                                      {typeof activity.rating === "number" && (
                                        <div className="text-sm text-orange-600">
                                          ★ {activity.rating.toFixed(1)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {activity.formattedAddress && (
                                    <p className="text-sm text-neutral-600">
                                      {activity.formattedAddress}
                                    </p>
                                  )}
                                  {activity.description && (
                                    <p className="text-sm text-neutral-700 mt-1 line-clamp-3">
                                      {activity.description}
                                    </p>
                                  )}
                                  {activity.userAction && (
                                    <p className="text-xs text-neutral-600 mt-1">
                                      Suggested: {activity.userAction}
                                    </p>
                                  )}
                                 </div>
                                  <div className="mt-4 pt-3 border-t border-gray-100">
                                    <a 
                                      href={`https://www.google.com/maps/place/?q=place_id:${activity.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
                                    >
                                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      <span className="text-sm">View on Google Maps</span>
                                    </a>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          }
                        )}
                      </motion.div>
                    ) : (
                      <div className="text-sm text-neutral-600">
                        No places for this day.
                      </div>
                    )}
                  </motion.div>
                  <motion.div
                    className="flex flex-col gap-3"
                    variants={itemReveal}
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-[700]">Hotels</h2>
                    </div>
                    {hotelsInitializing && (
                      <div className="mx-auto w-max flex items-center gap-5 h-[200px]">
                        <CircularProgress size={25} />
                        <p>Getting your hotels...</p>
                      </div>
                    )}
                    {hotelsSuccess && hotelsData.length > 0 && (
                      <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        variants={listReveal}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-80px" }}
                      >
                        {hotelsData
                          .sort(
                            (a: any, b: any) =>
                              a.estimatedPrice - b.estimatedPrice
                          )
                          .map((hotel: any) => (
                            <motion.div
                              key={hotel.displayName}
                              className="rounded-xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                              variants={itemReveal}
                            >
                              <div className="h-40 w-full bg-neutral-100 overflow-hidden">
                                <img
                                  src={`${hotel.photos?.[0]?.secure_url || ""}`}
                                  alt={`${hotel.displayName} Photo`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="p-4 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold truncate max-w-[80%]">
                                    {hotel.displayName}
                                  </p>
                                  <span className="text-orange-500">
                                    ★ {hotel?.rating || "N/A"}
                                  </span>
                                </div>
                                <p className="text-sm text-neutral-600">
                                  {hotel.formattedAddress}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-sm font-medium">
                                    From ${hotel.estimatedPrice}/night
                                  </span>
                                  <a
                                    href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
                                      hotel.displayName
                                    )}${parameters.when ? `&checkin=${parameters.when.split(" - ")[0]}&checkout=${parameters.when.split(" - ")[1]}` : ""}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm px-3 py-1.5 rounded-md bg-orange-600 text-white hover:bg-orange-700"
                                  >
                                    Book
                                  </a>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                      </motion.div>
                    )}
                  </motion.div>

                  <motion.div
                    variants={itemReveal}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-80px" }}
                  >
                    <AviasalesCard />
                  </motion.div>

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
