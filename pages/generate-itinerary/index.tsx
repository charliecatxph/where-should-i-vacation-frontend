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
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { ArrowUpRight, Share } from "lucide-react";
import AviasalesCard from "@/components/vacation/AviasalesCard";
import { handleAxiosError } from "@/functions/handleAxiosError";
import { useModal } from "@/components/modals/ModalContext";
import { fork } from "node:child_process";

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

export default function GenerateItinerary({ user, queries, api }: any) {
  const { showParameterError, showCreditError } = useModal();
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
    { name: "Ordinary Generation", route: "/" },
    { name: "Itinerary Builder", route: "/itinerary-builder" },
    { name: "Itinerary History", route: "/itinerary-history" },
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
            Authorization: `Bearer ${user.token}`,
          },
          withCredentials: true,
        }
      );

      if (!res.data?.cached) {
        dispatch(decrementItineraryCredits());
      }
      return res.data.itinerary?.[0] ?? res.data.itinerary;
    },
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 60 * 60 * 1000,
    retry: 1,
    enabled: Boolean(queries.uuid && user.token),
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
            Authorization: `Bearer ${user.token}`,
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
        user.token &&
        centralPoint?.latitude &&
        centralPoint.longitude
    ),
  });

  return (
    <>
      <main>
        <Header
          userData__final={userData__final}
          navButtons={navButtons}
          api={api}
        />
        <section className="py-6">
          <div className="ctx-container">
            <div className="wrapper px-5">
              {/* Loading */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full flex flex-col items-center justify-center py-24 gap-4"
                >
                  <CircularProgress size={36} disableShrink />
                  <p className="text-neutral-600">Generating itinerary…</p>
                </motion.div>
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
                              className={`flex-1 basis-0 min-w-[110px] px-4 py-2 text-sm rounded-lg transition-colors border text-center ${
                                idx === selectedDayIndex
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
                                <div className="p-4 flex flex-col gap-2">
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
                                    )}`}
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
