import {
  Calendar,
  Check,
  CircleQuestionMark,
  Info,
  MapPin,
  X,
  ChevronDown,
  Settings,
} from "lucide-react";
import { Geist, Inter, Raleway } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { DatePicker } from "@mantine/dates";
import { GetServerSidePropsContext } from "next";
const inter = Inter({ subsets: ["latin"] });
const geist = Geist({ subsets: ["latin"] });
import { useDispatch, useSelector } from "react-redux";
import {
  isUserDataComplete,
  selectUserData,
  setUser,
} from "@/redux/features/user";

import { authGate } from "@/authentication/authGate";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/router";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useClickOutside } from "@/hooks/UseClickOutside";
import Link from "next/link";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

export type DateRangeType = [Date | string | null, Date | string | null];
export type FormState = {
  activity: string;
  location: string;
  dateRange: DateRangeType;
  errors: {
    activity?: string;
    location?: string;
    date?: string;
  };
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const udc = await authGate(ctx);
  return udc;
};

export default function Home({ user, api }: any) {
  const router = useRouter();
  const dispatch = useDispatch();
  const userData = useSelector(selectUserData);

  // ---- USER DATA REDUX CONDITIONAL ---
  const userData__final = isUserDataComplete(userData) ? userData : user;
  useEffect(() => {
    if (!user) return;
    dispatch(setUser(user));
  }, [user]);

  const [showDatePicker, setShowDatePicker] = useState({
    active: false,
    start: null,
    end: null,
  });

  const datePickerRef = useClickOutside<HTMLDivElement>(() =>
    setShowDatePicker((pv) => ({ ...pv, active: false }))
  );

  const [form, setForm] = useState<FormState>({
    activity: "",
    location: "",
    dateRange: [null, null],
    errors: {},
  });

  const [locationInputFocused, setLocationInputFocused] = useState(false);
  const [debouncedLocation, setDebouncedLocation] = useState(form.location);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLocation(form.location);
    }, 300);
    return () => clearTimeout(handler);
  }, [form.location]);

  const [locationData, setLocationData] = useState<{
    results: any[];
    loading: boolean;
    error: unknown | null;
  }>({
    results: [],
    loading: false,
    error: null,
  });
  const queryClient = useQueryClient();

  const handlePurchase = async (plan: "Journeyman" | "Explorer") => {
    try {
      const url = await queryClient.fetchQuery({
        queryKey: ["purchase", plan],
        queryFn: async () => {
          const res = await axios.post(
            `${api}/purchase-credits`,
            {
              plan: plan,
            },
            {
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
            }
          );
          return res.data.url;
        },
      });
      window.location = url;
    } catch (e) {}
  };

  const getQueryLocations = async (
    debouncedLocation: string,
    token: string
  ) => {
    if (!debouncedLocation.trim()) return [];
    const res = await axios.get(`${api}/get-locations`, {
      params: { query: debouncedLocation },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data.suggestions;
  };

  useEffect(() => {
    let isMounted = true;
    const fetchLocations = async () => {
      if (!debouncedLocation.trim()) {
        if (isMounted)
          setLocationData({ results: [], loading: false, error: null });
        return;
      }
      if (isMounted)
        setLocationData((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await queryClient.fetchQuery({
          queryKey: ["location-search", debouncedLocation],
          queryFn: () => getQueryLocations(debouncedLocation, userData.token),
          staleTime: 60 * 60 * 1000,
        });
        if (isMounted)
          setLocationData({ results: data, loading: false, error: null });
      } catch (err) {
        if (isMounted)
          setLocationData({ results: [], loading: false, error: err });
      }
    };
    fetchLocations();
    return () => {
      isMounted = false;
    };
  }, [debouncedLocation, userData.token, queryClient]);

  const handleActivityChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      activity: value,
      errors: { ...prev.errors, activity: undefined },
    }));
  };

  const handleLocationChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      location: value,
      errors: { ...prev.errors, location: undefined },
    }));
  };

  const handleDateChange = (e: DateRangeType) => {
    setForm((prev) => ({
      ...prev,
      dateRange: e,
      errors: { ...prev.errors, date: undefined },
    }));
  };

  const getDateObj = (d: Date | string | null) => {
    if (!d) return null;
    if (typeof d === "string") return new Date(d);
    return d;
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { activity, location, dateRange } = form;
    const newErrors: { activity?: string; location?: string; date?: string } =
      {};
    if (!activity.trim()) newErrors.activity = "Activity is required.";
    if (!location.trim()) newErrors.location = "Location is required.";
    if (!dateRange[0] || !dateRange[1])
      newErrors.date = "Both start and end dates are required.";
    setForm((prev) => ({ ...prev, errors: newErrors }));
    if (Object.keys(newErrors).length > 0) return;
    const uuid = uuidv4();
    const start = dateRange[0]
      ? moment(getDateObj(dateRange[0])).format("MMM D")
      : "--";
    const end = dateRange[1]
      ? moment(getDateObj(dateRange[1])).format("MMM D")
      : "--";
    const params = new URLSearchParams({
      what: activity,
      where: location,
      when: `${start} - ${end}`,
      uuid,
    });
    router.push(`/generate?${params.toString()}`);
  };

  const navButtons = [
    { name: "How It Works", route: "/#how-it-works" },
    { name: "Itinerary Builder", route: "/itinerary-builder" },
    { name: "Pricing", route: "/#pricing" },
    { name: "Contact", route: "/#contact" },
  ];

  return (
    <>
      <main className={`${inter.className}`}>
        <Header
          userData__final={userData__final}
          navButtons={navButtons}
          api={api}
        />
        <section className="min-h-[600px] relative overflow-x-clip px-5  py-10">
          <div
            className="z-[-1] absolute left-0 top-10 pointer-events-none select-none flex flex-col gap-6 max-[1300px]:left-[-150] max-[600px]:hidden"
            style={{ width: "260px" }}
          >
            {[
              {
                src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
                alt: "Beach Vacation",
                extra: "ml-0",
              },
              {
                src: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
                alt: "City Adventure",
                extra: "ml-8",
              },
              {
                src: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80",
                alt: "Desert",
                extra: "-ml-4",
              },
              {
                src: "https://images.unsplash.com/photo-1465156799763-2c087c332922?auto=format&fit=crop&w=600&q=80",
                alt: "Forest",
                extra: "ml-10",
              },
            ].map((img, i) => (
              <motion.div
                key={img.src}
                initial={{ opacity: 0, x: -80 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "circOut", delay: 0.18 * i }}
                className={`rounded-xl shadow-lg border-4 border-white overflow-hidden aspect-[16/9] w-full ${img.extra}`}
                style={{ minWidth: "180px", maxWidth: "240px" }}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="object-cover w-full h-full"
                  style={{ aspectRatio: "16/9" }}
                />
              </motion.div>
            ))}
          </div>
          {/* Right collage */}
          <div
            className="z-[-1] absolute right-0 top-10 pointer-events-none select-none flex flex-col gap-6 items-end max-[1300px]:right-[-150] max-[600px]:hidden"
            style={{ width: "260px" }}
          >
            {[
              {
                src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80",
                alt: "Mountain Retreat",
                extra: "mr-0",
              },
              {
                src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
                alt: "Vacation Fun",
                extra: "mr-8",
              },
              {
                src: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=600&q=80",
                alt: "Road Trip",
                extra: "-mr-4",
              },
              {
                src: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80",
                alt: "Safari",
                extra: "mr-10",
              },
            ].map((img, i) => (
              <motion.div
                key={img.src}
                initial={{ opacity: 0, x: 80 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.8,
                  ease: "circOut",
                  delay: 0.18 * i + 0.2,
                }}
                className={`rounded-xl shadow-lg border-4 border-white overflow-hidden aspect-[16/9] w-full ${img.extra}`}
                style={{ minWidth: "180px", maxWidth: "240px" }}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="object-cover w-full h-full"
                  style={{ aspectRatio: "16/9" }}
                />
              </motion.div>
            ))}
          </div>
          {/* Decorative radial gradient, centered behind hero headline only */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-[260px] -translate-x-1/2 -translate-y-1/2 z-[-1] pointer-events-none select-none"
            style={{
              width: "700px",
              height: "380px",
              background:
                "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,99,233,0.55) 0%, rgba(255,204,0,0.35) 40%, rgba(0,191,255,0.25) 70%, transparent 100%)",
              filter: "blur(36px)",
              opacity: 0.3,
            }}
          />
          <div className="ctx-container">
            <div className="wrapper">
              <div className="middle pt-[200px] max-[600px]:pt-[150px]">
                <h1
                  className={`text-center font-[700] text-5xl tracking-tight ${geist.className} max-[1200px]:max-w-[60%] mx-auto max-[600px]:text-4xl max-[600px]:max-w-full`}
                >
                  Discover. Plan. Go. — All with AI ✨
                </h1>
                <p className="text-center mt-2 font-[400] text-lg text-neutral-800 max-[1300px]:max-w-2/3  mx-auto max-[600px]:max-w-full max-[600px]:text-base">
                  Let our AI be your smart travel buddy — from finding hidden
                  gems to crafting your perfect itinerary in seconds.
                </p>
                <form
                  onSubmit={handleFormSubmit}
                  className="border-1 border-neutral-200 p-5 flex gap-2 mt-5 bg-white rounded-xl max-[900px]:flex-col"
                >
                  <div className="input-box relative border-1 rounded-md border-neutral-200 py-1 w-full">
                    <div className="icon absolute h-[40px] w-[40px] grid place-items-center top-0.5">
                      <CircleQuestionMark strokeWidth={1.5} />
                    </div>
                    <div className="ml-[50px] flex flex-col">
                      <span className="font-[600] text-xs">Activity</span>
                      <input
                        type="text"
                        className="focus:outline-0 outline-0 text-sm"
                        placeholder="What do you want to do?"
                        value={form.activity}
                        onChange={handleActivityChange}
                      />
                      {form.errors.activity && (
                        <span className="text-xs text-red-600 mt-1">
                          {form.errors.activity}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="input-box relative border-1 rounded-md border-neutral-200 py-1 w-full">
                    <div className="icon absolute h-[40px] w-[40px] grid place-items-center  top-0.5">
                      <MapPin strokeWidth={1.5} />
                    </div>
                    <div className="ml-[50px] flex flex-col relative">
                      <span className="font-[600] text-xs">Location</span>
                      <input
                        type="text"
                        className="focus:outline-0 outline-0 text-sm"
                        placeholder="Where do you want to go?"
                        value={form.location}
                        onChange={handleLocationChange}
                        onFocus={() => setLocationInputFocused(true)}
                        onBlur={() =>
                          setTimeout(() => setLocationInputFocused(false), 200)
                        }
                      />
                      {form.errors.location && (
                        <span className="text-xs text-red-600 mt-1">
                          {form.errors.location}
                        </span>
                      )}
                      {locationInputFocused && (
                        <div className="absolute top-full w-full  bg-white z-[3] rounded-b-2xl border-1 border-neutral-100 shadow-sm shadow-neutral-100">
                          <ul>
                            {locationData.loading ? (
                              <li className="py-3 px-6 text-sm font-[500] text-center select-none">
                                <svg
                                  className="animate-spin mx-auto"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                  />
                                </svg>
                              </li>
                            ) : locationData.error ? (
                              <li className="py-3 px-6 text-sm font-[500] text-center select-none text-red-600">
                                Error loading locations
                              </li>
                            ) : locationData.results &&
                              locationData.results.length > 0 ? (
                              locationData.results
                                .slice(0, 5)
                                .map((loc: string, idx: number) => (
                                  <li
                                    key={loc + idx}
                                    className="py-3 px-6 font-[500] hover:bg-neutral-50 border-b-1 border-neutral-100 text-sm"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setForm((prev) => ({
                                          ...prev,
                                          location: loc,
                                        }));
                                        setLocationInputFocused(false);
                                      }}
                                    >
                                      <span className="text-left">{loc}</span>
                                    </button>
                                  </li>
                                ))
                            ) : !locationData.loading &&
                              locationData.results.length === 0 &&
                              debouncedLocation.trim() ? (
                              <li className="py-3 px-6 text-sm font-[500] text-center select-none">
                                No locations match your search.
                              </li>
                            ) : null}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="input-box relative border-1 rounded-md border-neutral-200 py-1 w-full">
                    <div className="icon absolute h-[40px] w-[40px] grid place-items-center  top-0.5">
                      <Calendar strokeWidth={1.5} />
                    </div>
                    <div className="ml-[50px] flex flex-col z-[1]">
                      <span className="font-[600] text-xs">Date</span>
                      <button
                        type="button"
                        className="current-value select-none w-full text-left"
                        onClick={() =>
                          setShowDatePicker((pv) => ({
                            ...pv,
                            active: !pv.active,
                          }))
                        }
                      >
                        <span
                          className={`ctx-unselected ${
                            !(form.dateRange[0] && form.dateRange[1]) &&
                            "text-neutral-500"
                          }`}
                        >
                          {form.dateRange[0]
                            ? moment(getDateObj(form.dateRange[0])).format(
                                "MMM D"
                              )
                            : "--"}{" "}
                          /{" "}
                          {form.dateRange[1]
                            ? moment(getDateObj(form.dateRange[1])).format(
                                "MMM D"
                              )
                            : "--"}
                        </span>
                      </button>
                      <AnimatePresence>
                        {showDatePicker.active && (
                          <motion.div
                            ref={datePickerRef}
                            initial={{
                              opacity: 0,
                              y: -5,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            exit={{
                              opacity: 0,
                              y: -5,
                            }}
                            key={"date-picker-ref"}
                            className="absolute z-[3] top-full bg-white p-5 rounded-b-2xl border-1 border-neutral-100 shadow-sm shadow-neutral-10"
                          >
                            <DatePicker
                              type="range"
                              minDate={new Date()}
                              value={form.dateRange}
                              onChange={handleDateChange}
                            />
                          </motion.div>
                        )}
                        {form.errors.date && (
                          <span className="text-xs text-red-600 mt-1">
                            {form.errors.date}
                          </span>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="max-[900px]:w-full max-[900px]:h-[40px]  bg-orange-600 text-white font-[600] px-5 rounded-full text-[15px] mx-auto"
                  >
                    Go
                  </button>
                </form>
                <div className="x-powered-by flex gap-5 items-center justify-center text-xs font-[500] mt-10 opacity-80">
                  <p>Powered by</p>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/512px-OpenAI_Logo.svg.png"
                    alt=""
                    className="max-w-[70px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="how-it-works px-5">
          <div className="ctx-container">
            <div className="wrapper flex gap-5 bg-blue-900 rounded-lg overflow-hidden shadow-lg shadow-neutral-200 border-1 border-blue-600 h-[400px] max-[900px]:h-auto max-[900px]:flex-col">
              <div className="basis-1/2 px-8 py-10">
                <h1 className="text-3xl font-bold text-white max-[600px]:text-2xl">
                  Meet Your New AI Travel Buddy
                </h1>
                <p className="text-[14px] mt-2 text-neutral-200 max-[600px]:text-[12px]">
                  Planning a trip just got way easier. Let our smart AI do the
                  heavy lifting—get fun ideas, cool places to visit, and awesome
                  things to do, all picked just for you. It's like talking to a
                  travel agency! Just with more personalization!
                </p>
                <ol className="list-decimal ml-6 text-white text-sm space-y-1 mt-3 max-[600px]:text-[12px]">
                  <li>
                    <span className="font-semibold">User entry:</span> You tell
                    us what you want to do and where you want to go.
                  </li>
                  <li>
                    <span className="font-semibold">Smart search:</span> We
                    gather the latest data from our travel partners and consider
                    your previous trips.
                  </li>
                  <li>
                    <span className="font-semibold">Personalized results:</span>{" "}
                    We show you the best places and activities, tailored just
                    for you.
                  </li>
                </ol>
              </div>
              <div className="basis-1/2 bg-white h-full flex-1">
                <img
                  src="hwit-alt.avif"
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>
        <section className="itinerary-expl">
          <div className="ctx-container">
            <div className="wrapper px-5">
              <h1 className="text-3xl font-[800] text-center mt-20 max-[600px]:text-2xl">
                Your Trip, Designed for You — Not the Masses
              </h1>
              <p className="text-center font-[500] text-neutral-700 mt-1">
                It’s not about where everyone goes. It’s about where you belong.
              </p>
              <div className="flex mt-10 max-[900px]:flex-col-reverse max-[900px]:gap-20">
                <div
                  className={`${geist.className} basis-1/2 font-[400] flex gap-2 flex-col justify-center`}
                >
                  <p>
                    Tired of the same old postcard destinations and pre-packaged
                    tours? <span className="font-[600]">We are too.</span>{" "}
                    That’s why we built a smarter way to travel — one that puts{" "}
                    <span className="font-[600]">you</span> at the center.
                  </p>

                  <p>
                    With our powerful itinerary builder, every plan is crafted
                    with{" "}
                    <span className="font-[600]">utmost personalization</span>.
                    No cookie-cutter experiences. No trendy spots just for
                    Instagram. Whether you crave{" "}
                    <span className="text-orange-600 font-[600]">
                      hidden photo spots
                    </span>
                    ,{" "}
                    <span className="text-orange-600 font-[600]">
                      indie bookstores
                    </span>
                    ,{" "}
                    <span className="text-orange-600 font-[600]">
                      night markets
                    </span>
                    , or{" "}
                    <span className="text-orange-600 font-[600]">
                      serene escapes
                    </span>
                    , we’ll build what you want, where you want it.
                  </p>

                  <p>
                    Coming from another country? No worries — we’ll match you
                    with flights that align with your schedule, comfort, and
                    budget. We’ll even pair them with hotel options that suit
                    your taste, from{" "}
                    <span className="font-[600]">cozy boutiques</span> to{" "}
                    <span className="font-[600]">premium stays</span> — all
                    seamlessly integrated into your itinerary.
                  </p>

                  <p>
                    Say goodbye to generic. Say hello to a journey that feels{" "}
                    <span className="font-[600]">personal</span>,{" "}
                    <span className="font-[600]">intentional</span>, and{" "}
                    <span className="font-[600]">entirely yours</span>. And if
                    you want even more personalization? You can freely edit the
                    itinerary as you wish.
                  </p>

                  <p className="font-[500]">
                    Book with your favorite partners:
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2 text-sm">
                    <a
                      href="#"
                      className="bg-[#003580] text-white font-[600] px-4 py-2 rounded-lg hover:opacity-90 transition"
                    >
                      Booking.com
                    </a>

                    <a
                      href="#"
                      className="bg-[#FF6D00] text-white font-[600] px-4 py-2 rounded-lg hover:opacity-90 transition"
                    >
                      Aviasales
                    </a>
                  </div>
                  <div className="flex gap-2 pt-3 text-neutral-700 text-sm">
                    <Info size={"40px"} className="h-max" />
                    <span>
                      Every pricing decision is driven by real-time data from
                      our trusted travel platforms. When data is limited or
                      missing, we still generate recommendations — but budget
                      constraints may be relaxed to ensure you still get viable
                      options.
                    </span>
                  </div>
                </div>
                <div className="basis-1/2">
                  <div className="flex justify-center items-center h-full relative">
                    <img
                      src="/itinerary-ex.png"
                      alt="Itinerary Example"
                      style={{
                        width: "90%",
                        maxWidth: "320px",
                        transform:
                          "perspective(700px) rotateY(-16deg) rotateX(8deg) scale(0.98)",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    {/* Chat head */}
                    <div
                      style={{
                        position: "absolute",
                        left: "10%",
                        bottom: "-10%",
                        zIndex: 2,
                        minWidth: "210px",
                        background: "white",
                        boxShadow: "0 2px 12px 0 rgba(0,0,0,0.04)",
                        borderRadius: "1.5rem",
                        padding: "1.1rem 1.3rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.7rem",
                      }}
                    >
                      <div className="flex flex-col gap-2 max-[600px]:text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800 min-w-[56px]">
                            What
                          </span>
                          <span className="text-sm font-[400] text-gray-800">
                            photography... budget trip if possible.
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800 min-w-[56px]">
                            Where
                          </span>
                          <span className="text-sm font-[400] text-gray-800">
                            Tokyo, Japan
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800 min-w-[56px]">
                            When
                          </span>
                          <span className="text-sm font-[400] text-gray-800">
                            May 12 - May 18
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-gray-800 min-w-[56px] mt-1">
                            Prefer
                          </span>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                            >
                              Adventure
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                            >
                              All
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                            >
                              Foodie
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium"
                            >
                              Culture
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="pricing">
          <div className="ctx-container">
            <div className="wrapper mt-[100px] px-5">
              <h1 className="text-3xl font-[700] text-center max-[600px]:text-2xl">
                A pricing structure that is friendly
              </h1>
              <p className="text-center font-[500] text-neutral-700 mt-1">
                No subscriptions, no monthly fees — just pay for what you need,
                when you need it. Simple, transparent, and commitment-free.
              </p>
              <div className="pricing-structure grid grid-cols-3 gap-2 mt-10 max-[900px]:grid-cols-1">
                <div className="price-card border-1 border-neutral-100 shadow-sm shadow-neutral-100 px-10 py-8 rounded-md">
                  <div className="tag bg-neutral-50 w-max px-5 py-1 rounded-full font-[600] border-1 border-neutral-200 text-xs">
                    <span>Traveler</span>
                  </div>
                  <h1 className="price font-[600] text-3xl mt-5">Free</h1>
                  <p className="description mt-2 text-sm">
                    For the light-footed and curious. You like to keep things
                    simple — maybe planning one getaway at a time or just trying
                    things out. No rush, no pressure, just smooth exploration at
                    your own pace.
                  </p>
                  <ul className="space-y-2 mt-4">
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">
                        <Check className="w-4 h-4" strokeWidth={2} />
                      </span>
                      <span>Personalized itinerary builder</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">
                        <Check className="w-4 h-4" strokeWidth={2} />
                      </span>
                      <span>
                        10 AI-Powered Generations{" "}
                        <span className="text-xs text-neutral-500">
                          (refreshes to 10 per day if used)
                        </span>
                      </span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">
                        <Check className="w-4 h-4" strokeWidth={2} />
                      </span>
                      <span>
                        1 Itinerary{" "}
                        <span className="text-xs text-neutral-500">
                          (refreshes to 1 per month if used)
                        </span>
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="flex gap-2 max-[900px]:flex-col-reverse">
                  <div className="price-card border-1 text-white border-neutral-100 shadow-sm shadow-neutral-100 px-10 py-8 rounded-md bg-gradient-to-b from-orange-600 to-blue-500 scale-110 z-10 max-[900px]:scale-100">
                    <div className="tag bg-orange-50 text-orange-600 w-max px-5 py-1 rounded-full font-[600] border-1 border-orange-200 text-xs">
                      <span>Journeyman</span>
                    </div>
                    <h1 className="price font-[600] text-3xl mt-5">$10</h1>
                    <p className="description mt-2 text-sm font-[500]">
                      For the seasoned traveler or the trusted planner. You plan
                      for yourself, sometimes for others. You're all about
                      depth, detail, and having a solid lineup of trips —
                      because one journey is never enough.
                    </p>
                    <ul className="space-y-2 mt-4 font-[500]">
                      <li className="flex items-center gap-2 text-sm">
                        <span className="text-white">
                          <Check className="w-4 h-4" strokeWidth={3} />
                        </span>
                        <span>Personalized itinerary builder</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <span className="text-white">
                          <Check className="w-4 h-4" strokeWidth={3} />
                        </span>
                        <span>
                          45 AI-Powered Generations{" "}
                          <span className="text-xs text-neutral-100">
                            (resets to Traveler if used)
                          </span>
                        </span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <span className="text-white">
                          <Check className="w-4 h-4" strokeWidth={3} />
                        </span>
                        <span>
                          12 Itineraries{" "}
                          <span className="text-xs text-neutral-100">
                            (resets to Traveler if used)
                          </span>
                        </span>
                      </li>
                    </ul>
                    {userData__final && (
                      <button
                        className="bg-white text-black hover:bg-neutral-100 px-5 py-1 text-sm rounded-full mt-5"
                        onClick={() => handlePurchase("Journeyman")}
                      >
                        <span className="font-bold text-sm">Purchase</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="price-card border-1 border-neutral-100 shadow-sm shadow-neutral-100 px-10 py-8 rounded-md">
                  <div className="tag bg-blue-50 text-blue-600 w-max px-5 py-1 rounded-full font-[600] border-1 border-blue-200 text-xs">
                    <span>Explorer</span>
                  </div>
                  <h1 className="price font-[600] text-3xl mt-5">$5</h1>
                  <p className="description mt-2 text-sm">
                    For the thoughtful wanderer. You enjoy comparing ideas,
                    checking multiple routes, and making sure every trip is just
                    right. You’re open to possibilities, and always have a few
                    options ready to go.
                  </p>
                  <ul className="space-y-2 mt-4">
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">
                        <Check className="w-4 h-4" strokeWidth={2} />
                      </span>
                      <span>Personalized itinerary builder</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">
                        <Check className="w-4 h-4" strokeWidth={2} />
                      </span>
                      <span>
                        20 AI-Powered Generations{" "}
                        <span className="text-xs text-neutral-500">
                          (resets to Traveler if used)
                        </span>
                      </span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">
                        <Check className="w-4 h-4" strokeWidth={2} />
                      </span>
                      <span>
                        5 Itineraries{" "}
                        <span className="text-xs text-neutral-500">
                          (resets to Traveler if used)
                        </span>
                      </span>
                    </li>
                  </ul>
                  {userData__final && (
                    <button
                      className="bg-black text-white hover:bg-neutral-900 px-5 py-1 text-sm rounded-full mt-5"
                      onClick={() => handlePurchase("Explorer")}
                    >
                      <span className="font-bold text-sm">Purchase</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="faq">
          <div className="ctx-container">
            <div className="wrapper">
              <FAQAccordion />
            </div>
          </div>
        </section>
        <section className="ready-to-try py-5 mt-10">
          <div className="ctx-container">
            <div className="wrapper">
              <h1 className="font-[700] text-3xl text-center mt-10">
                Ready, Set, Explore!
              </h1>
              <button className="bg-orange-600 hover:bg-orange-500 shadow-sm shadow-neutral-100 px-8 py-2 text-white rounded-md mx-auto font-[600] block mt-5">
                Let's Explore
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function FAQAccordion() {
  const faqs = [
    {
      q: "Is this really powered by AI?",
      a: "Yes — your plans are intelligently crafted using OpenAI’s cutting-edge large language models, capable of understanding your preferences, travel goals, and constraints to deliver highly personalized itineraries. It’s not just automation — it’s intelligent recommendation.",
    },
    {
      q: "Can I use this for free?",
      a: "Absolutely. Our Traveler tier is designed for curious minds and casual explorers who want to try intelligent travel planning at no cost. It’s a great way to experience our features before diving deeper into exploration.",
    },
    {
      q: "What if I want to edit my itinerary?",
      a: "Every itinerary we generate is fully customizable. Whether you want to shift destinations, adjust timelines, or swap activities, you’re in control. We believe AI should enhance your plans, not replace your preferences.",
    },
    {
      q: "Do you book flights and hotels for me?",
      a: "While we don’t process bookings directly, we match you with real-time results from trusted partners like Booking.com, Expedia, Agoda, and others. You’ll get filtered, optimized recommendations tailored to your plan — and can book directly with one click.",
    },
    {
      q: "How do you make price recommendations?",
      a: "All pricing insights are powered by live data integrations with Amadeus and the Google Travel Platform. That means our recommendations are backed by up-to-date flight, lodging, and activity pricing. If we can’t find relevant pricing in real time, we may set aside budget constraints to ensure a meaningful plan is still generated.",
    },
    {
      q: "Is my data safe?",
      a: "We take your privacy seriously. All sensitive data is securely stored using encrypted systems and never shared with third parties without your clear consent. Any payments are processed securely via Stripe, an industry leader in secure transactions. You’re in safe hands.",
    },
    {
      q: "Do you show ads?",
      a: "Yes, we show relevant travel-related ads to support our operations and keep the base experience free. These ads are never intrusive and are thoughtfully integrated to benefit your journey planning.",
    },
    {
      q: "What are the differences between plans?",
      a: "Every plan includes the full feature set: real-time AI-assisted planning, partner integrations, and editing capabilities. The only difference lies in the number of credits — more credits let you generate more plans per month, perfect for explorers and frequent travelers.",
    },
    {
      q: "Can I use this for group travel?",
      a: "Yes! Whether you’re planning solo, with a partner, or in a group, our system adapts to group preferences and logistics, giving you smarter plans no matter how many are traveling.",
    },
    {
      q: "What if I need help or support?",
      a: "We’ve got you covered. Our support team is available via live chat and email, and we're building a growing knowledge base to help you get answers fast. Whether it’s a bug, a suggestion, or a travel dilemma — we’re here.",
    },
  ];

  // State for open accordions (multiple allowed)
  const [openIndices, setOpenIndices] = React.useState<number[]>([]);

  // Handler for toggling accordion
  const handleToggle = (idx: number) => {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // Render
  return (
    <div className="mx-auto mt-20 px-5">
      <h1 className="text-3xl font-bold text-center max-[600px]:text-2xl">
        Frequently Asked Questions
      </h1>
      <p className="text-center font-[500] text-neutral-700 mt-2">
        Got questions? We've answered the most common ones below to help you
        plan with confidence — clear, honest, and upfront.
      </p>
      <ul className="grid grid-cols-2 gap-2 max-w-5xl mx-auto mt-5 max-[900px]:grid-cols-1">
        {faqs.map((faq, idx) => (
          <li key={faq.q}>
            <button
              className={`w-full flex justify-between items-center px-0 py-3 font-[600] text-left transition-colors ${
                openIndices.includes(idx)
                  ? "text-orange-600"
                  : "hover:text-orange-600 text-neutral-800"
              }`}
              onClick={() => handleToggle(idx)}
              aria-expanded={openIndices.includes(idx)}
              aria-controls={`faq-panel-${idx}`}
              type="button"
              style={{ background: "none", border: "none", outline: "none" }}
            >
              <span className="text-lg">{faq.q}</span>
              <span
                className={`ml-4 transition-transform duration-200 ${
                  openIndices.includes(idx)
                    ? "rotate-180 text-orange-600"
                    : "rotate-0 text-neutral-400"
                }`}
                style={{ display: "flex", alignItems: "center" }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 8L10 12L14 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            <AnimatePresence initial={false}>
              {openIndices.includes(idx) && (
                <motion.div
                  id={`faq-panel-${idx}`}
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="pl-0 pr-8 pb-4 pt-1 text-neutral-700">
                    {faq.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        ))}
      </ul>
    </div>
  );
}
