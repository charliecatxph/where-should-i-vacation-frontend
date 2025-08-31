import { Inter, Anton } from "next/font/google";
import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setUser,
  selectUserData,
  isUserDataComplete,
} from "@/redux/features/user";
import { handleAxiosError } from "@/functions/handleAxiosError";
import { GetServerSidePropsContext } from "next";
import { authGate } from "@/authentication/authGate";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, TriangleAlert } from "lucide-react";
import { createPortal } from "react-dom";
import { Header } from "@/components/Header";
import HotelCard from "@/components/vacation/HotelCard";
import HotelSwiper from "@/components/vacation/HotelSwiper";
import PlaceShowcase from "@/components/vacation/PlaceShowcase";
import AviasalesCard from "@/components/vacation/AviasalesCard";
import ItineraryAd from "@/components/vacation/ItineraryAd";
import Footer from "@/components/Footer";
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });
const anton = Anton({ weight: "400", subsets: ["latin"] });

// Loading Spinner Component for Place Showcase
const PlaceLoadingSpinner = () => {
  const messages = [
    "Loading your vacation destination...",
    "Discovering amazing places...",
    "Gathering place details...",
    "Finding the perfect spot...",
    "Loading destination info...",
    "Preparing your travel guide...",
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-12 w-full h-[300px]"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-14 h-14 border-4 border-gray-200 border-t-orange-500 rounded-full"
      />
      <div className="h-8 mt-4 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentMessageIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.5,
              ease: "easeInOut",
            }}
            className={`${inter.className} text-gray-600 text-lg text-center`}
          >
            {messages[currentMessageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const udc = await authGate(ctx);
  return udc;
};

export default function Vacation({ user, queries, api }: any) {
  const dispatch = useDispatch();
  const userData = useSelector(selectUserData);
  const router = useRouter();

  // ---- USER DATA REDUX CONDITIONAL ---
  const userData__final = isUserDataComplete(userData) ? userData : user;
  useEffect(() => {
    if (!user) return;
    dispatch(setUser(user));
  }, [user]);

  const {
    data: placeData = [],
    isLoading: placeLoading,
    status: placeStatus,
    error: placeError,
  } = useQuery({
    queryKey: ["view-place", queries.place],
    queryFn: async () => {
      const params = new URLSearchParams({
        id: queries.place,
      });

      const res = await axios.get(`${api}/view-place?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${userData__final.token}`,
        },
        withCredentials: true,
        timeout: 30000,
      });

      return res.data.place;
    },
    enabled: Boolean(queries.place && userData__final.token),
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  // Hotels query - executes only after place data is loaded and coordinates are available
  const {
    data: hotelsData,
    isLoading: hotelsLoading,
    error: hotelsError,
  } = useQuery({
    queryKey: [
      "get-place-hotels",
      placeData?.location?.latitude,
      placeData?.location?.longitude,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        lat: placeData.location.latitude.toString(),
        lng: placeData.location.longitude.toString(),
      });

      const res = await axios.get(
        `${api}/get-place-hotels?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${userData.token}`,
          },
          withCredentials: true,
          timeout: 3 * 60 * 1000,
        }
      );

      return res.data.hotels;
    },
    enabled: Boolean(
      placeData?.location?.latitude &&
      placeData?.location?.longitude &&
      userData.token
    ),
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (!placeError) return;

    const wtaError = handleAxiosError(placeError as AxiosError);

    if (["PLACE_NOT_EXIST"].includes(wtaError)) {
      router.push("/");
    }
  }, [placeError]);

  // Handle hotels query errors
  useEffect(() => {
    if (!hotelsError) return;

    const wtaError = handleAxiosError(hotelsError as AxiosError);

    // Handle specific errors for hotels
    // if (
    //   ["USER_NOT_EXIST", "SERVER_ERROR", "HOTELS_NOT_FOUND"].includes(wtaError)
    // ) {
    //   console.log("Redirecting due to hotels error:", wtaError);
    //   // You can add router.push("/") here if needed
    // }
  }, [hotelsError]);

  const navButtons = [
    { name: "Generation", route: "/" },
  ];

  return (
    <>
      <Head>
        <title>{placeData?.displayName?.text || "Getting place..."}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${inter.className} relative`}>
        <Header
          userData__final={userData__final}
          navButtons={navButtons}
          api={api}
        />
        <AnimatePresence>
          {placeLoading ? (
            <PlaceLoadingSpinner />
          ) : (
            <>
              <PlaceShowcase placeData={placeData} />
              <HotelSwiper
                hotelsLoading={hotelsLoading}
                hotelsData={hotelsData}
                placeData={placeData}
                dates={queries?.dates ?? ""}
              />
              <div className="px-5">
                <AviasalesCard />
              </div>
              <ItineraryAd />
            </>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </>
  );
}
