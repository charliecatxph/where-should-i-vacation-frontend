import {
  Check,
  Info,
  MapPin,
  CalendarRange,
  Search,
  Sparkle,
  Eye,
  Wrench,
} from "lucide-react";
import { Cookie, Geist, Inter, Raleway } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { DatePicker } from "@mantine/dates";
import { GetServerSidePropsContext } from "next";
const inter = Inter({ subsets: ["latin"] });
const geist = Geist({ subsets: ["latin"] });
const cookie = Cookie({ weight: "400", subsets: ["latin"] });
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
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import Head from "next/head";
import ItineraryShowcase from "@/components/ItineraryShowcase";

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

  // Tab state for switching between Smart Search and Itinerary Builder
  const [activeTab, setActiveTab] = useState<
    "smart-search" | "itinerary-builder"
  >("smart-search");

  // Preferences popup state (for itinerary builder)
  const [showPreferencesPopup, setShowPreferencesPopup] = useState(false);
  const [pendingParams, setPendingParams] = useState<URLSearchParams | null>(
    null
  );
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

  // Grouped preferences (from itinerary builder)
  const preferenceGroups = [
    {
      label: "Experience",
      options: [
        "Adventure",
        "Relaxation",
        "Culture",
        "Nightlife",
        "Nature",
        "Family",
        "History",
        "Festivals",
        "Solo Travel",
      ],
    },
    {
      label: "Style",
      options: [
        "Luxury",
        "Budget",
        "Romance",
        "Wellness",
        "Sports",
        "Art",
        "Photography",
        "Hidden Gems",
      ],
    },
    {
      label: "Interest",
      options: ["Foodie", "Shopping", "Technology", "Local"],
    },
  ];

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
    } catch (e) { }
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

  // Dynamically cap the selectable date range to 7 days after the chosen start date (for itinerary builder)
  const maxDateFromStart: Date | undefined = (() => {
    const startDate = getDateObj(form.dateRange[0]);
    if (!startDate) return undefined;
    const max = new Date(startDate);
    max.setDate(max.getDate() + 7);
    return max;
  })();

  const handleFormSubmit = (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    const { activity, location, dateRange } = form;
    const newErrors: { activity?: string; location?: string; date?: string } =
      {};
    if (!activity.trim()) newErrors.activity = "Activity is required.";
    // Location is now optional - we'll find one if empty
    if (!dateRange[0] || !dateRange[1])
      newErrors.date = "Both start and end dates are required.";
    setForm((prev) => ({ ...prev, errors: newErrors }));
    if (Object.keys(newErrors).length > 0) return;
    const uuid = uuidv4();
    console.log(dateRange[0], dateRange[1])
    const params = new URLSearchParams({
      what: activity,
      where: location,
      when: `${dateRange[0]} - ${dateRange[1]}`,
      uuid,
    });

    if (activeTab === "itinerary-builder") {
      // For itinerary builder, show preferences popup first
      setPendingParams(params);
      setShowPreferencesPopup(true);
    } else {
      // For smart search, go directly to generate page
      router.push(`/generate?${params.toString()}`);
    }
  };

  const handlePreferenceToggle = (pref: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handlePreferencesConfirm = () => {
    if (pendingParams) {
      if (selectedPreferences.length > 0) {
        pendingParams.set("preferences", selectedPreferences.join(","));
      }
      router.push(`/generate-itinerary?${pendingParams.toString()}`);
      setPendingParams(null);
      setSelectedPreferences([]);
      setShowPreferencesPopup(false);
    }
  };

  const handlePreferencesCancel = () => {
    setShowPreferencesPopup(false);
    setSelectedPreferences([]);
    setPendingParams(null);
  };

  const navButtons = [
    { name: "Generation", route: "/#generation" },
    { name: "Pricing", route: "/#pricing" },
    { name: "FAQ", route: "/#faq" },
  ];

  return (
    <>
      <AnimatePresence>
        {showPreferencesPopup && (
          <motion.div
            className="fixed inset-0 z-[9999999999999] flex items-center justify-center bg-neutral-900/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl flex flex-col relative max-w-[600px] w-full max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="p-6 pb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold mb-2 text-center w-full max-[500px]:text-xl">
                  What do you prefer?
                </h2>
                <p className="text-gray-600 mb-4 text-center w-full max-[500px]:text-sm">
                  Select as many as you like to help us personalize your trip.
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-6">
                <div className="flex flex-row flex-wrap gap-x-8 gap-y-4 items-start w-full max-[600px]:gap-x-4">
                  {preferenceGroups.map((group) => (
                    <div
                      key={group.label}
                      className="flex flex-col min-w-[180px] max-[600px]:min-w-[140px] max-[500px]:min-w-full"
                    >
                      <span className="font-semibold text-sm text-orange-600 mb-1 mt-2">
                        {group.label}
                      </span>
                      <div className="flex flex-row flex-wrap gap-2">
                        {group.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            className={`px-4 py-2 rounded-full border transition-all duration-200 text-sm font-medium shadow-sm focus:outline-none max-[500px]:px-3 max-[500px]:py-1.5 max-[500px]:text-xs
                              ${selectedPreferences.includes(opt)
                                ? "bg-orange-500 text-white border-orange-500 scale-105"
                                : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-orange-100 hover:border-orange-300"
                              }
                            `}
                            onClick={() => handlePreferenceToggle(opt)}
                            aria-pressed={selectedPreferences.includes(opt)}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 p-6 pt-4 flex-shrink-0 justify-center max-[500px]:flex-col">
                <button
                  onClick={handlePreferencesConfirm}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-lg transition-all max-[500px]:w-full"
                >
                  Confirm
                </button>
                <button
                  onClick={handlePreferencesCancel}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-all max-[500px]:w-full"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Head>
        <title>
          Where Should I Vacation - Discover. Plan. Go. — All with AI ✨
        </title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${inter.className}`}>
        <Header
          userData__final={userData__final}
          navButtons={navButtons}
          api={api}
        />
        <section className="relative min-h-screen mt-5 max-[500px]:mt-0">
          <div className="bg h-full w-full px-5 absolute z-[-1] max-[500px]:px-0">
            <div className="rounded-2xl overflow-hidden h-full relative z-[-1] max-[500px]:rounded-[0px]">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              >
                <source src="herovid.mp4"></source>
              </video>
              {/* Black overlay with opacity, ensure it covers the video */}
              <div className="pointer-events-none absolute inset-0 bg-black/50 z-10" />
            </div>
          </div>
          <div className="main-hero px-5 max-[500px]:px-0 text-white">
            <div className="ctx-container-vxt2">
              <div className="wrapper pt-[250px] py-10 px-5 max-[700px]:pt-[125px]">
                <h1
                  className={`text-[4rem] font-[700] ${geist.className} leading-[70px] max-w-[70%] max-[1350px]:max-w-[100%] max-[1350px]:text-center max-[1000px]:text-[3rem] max-[1000px]:leading-[50px] max-[700px]:text-[2rem] max-[700px]:leading-[35px]`}
                >
                  Discover. Plan. Go. — All with AI ✨
                </h1>
                <p
                  className={`${geist.className} max-w-[50%] mt-5 font-[500] text-neutral-100 max-[1350px]:text-center max-[1350px]:max-w-[100%] max-[1000px]:text-[1rem] max-[700px]:text-[0.9rem]`}
                >
                  Turn your travel dreams into reality with AI-powered planning.
                  Discover hidden gems, design personalized itineraries, and
                  organize every detail — from flights and stays to activities
                  and dining. Whether it’s a quick getaway or a
                  once-in-a-lifetime adventure, everything you need to plan and
                  go is right at your fingertips.
                </p>
                <div className="mt-15">
                  <ul className="flex items-center w-max max-[700px]:w-full text-black rounded-t-2xl overflow-hidden">
                    <li className="max-[700px]:flex-1">
                      <button
                        className={`w-full px-5 py-3 transition-all ${activeTab === "smart-search"
                          ? "bg-white text-black"
                          : "bg-white/40 text-white hover:bg-white/60"
                          }`}
                        onClick={() => setActiveTab("smart-search")}
                      >
                        <span className="font-[600] flex items-center gap-3 max-[700px]:text-[0.8rem]">
                          <Sparkle
                            size="19"
                            color={
                              activeTab === "smart-search"
                                ? "#a259f7"
                                : "#ffffff"
                            }
                            className={
                              activeTab === "smart-search"
                                ? "animate-pulse max-[400px] mx-auto"
                                : "mx-auto"
                            }
                          />{" "}
                          <span className="max-[400px]:hidden">
                            Smart Search
                          </span>
                        </span>
                      </button>
                    </li>
                    <li className="max-[700px]:flex-1">
                      <button
                        className={`w-full px-5 py-3 transition-all ${activeTab === "itinerary-builder"
                          ? "bg-white text-black"
                          : "bg-white/40 text-white hover:bg-white/60"
                          }`}
                        onClick={() => setActiveTab("itinerary-builder")}
                      >
                        <span className="font-[600] flex items-center gap-3 max-[700px]:text-[0.8rem]">
                          <Wrench
                            size="19"
                            color={
                              activeTab === "itinerary-builder"
                                ? "#ea580c"
                                : "#ffffff"
                            }
                            className={
                              activeTab === "itinerary-builder"
                                ? "animate-pulse max-[400px] mx-auto"
                                : "mx-auto"
                            }
                          />{" "}
                          <span className="max-[400px]:hidden">
                            Itinerary Builder
                          </span>
                        </span>
                      </button>
                    </li>
                  </ul>
                  {activeTab === "smart-search" ? (
                    <div
                      className={`${geist.className} inputs w-[80%] text-black bg-white px-5 py-6 rounded-r-2xl rounded-bl-2xl max-[700px]:rounded-tr-[0px] flex gap-5 max-[1350px]:flex-col max-[1350px]:w-full`}
                    >
                      <div className="input-box relative py-1 flex-1">
                        <div className="icon absolute h-[40px] w-[40px] grid place-items-center top-0.5">
                          <Eye strokeWidth={1.5} />
                        </div>
                        <div className="ml-[50px] flex flex-col">
                          <span className="font-[600] text-sm">Experience</span>
                          <input
                            type="text"
                            placeholder="Enter the experience you want to have on the place."
                            className="w-full focus:outline-0 outline-0 text-sm"
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
                      <div className="input-box relative py-1 flex-1">
                        <div className="icon absolute h-[40px] w-[40px] grid place-items-center top-0.5">
                          <MapPin strokeWidth={1.5} />
                        </div>
                        <div className="ml-[50px] flex flex-col relative">
                          <span className="font-[600] text-sm">Location</span>
                          <input
                            type="text"
                            className="focus:outline-0 outline-0 text-sm"
                            placeholder="Where do you want to go?"
                            value={form.location}
                            onChange={handleLocationChange}
                            onFocus={() => setLocationInputFocused(true)}
                            onBlur={() =>
                              setTimeout(
                                () => setLocationInputFocused(false),
                                200
                              )
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
                                          <span className="text-left">
                                            {loc}
                                          </span>
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

                      <div className="flex flex-col flex-1">
                        <div className="flex gap-5 relative max-[700px]:flex-col">
                          <div className="input-box relative py-1 flex-1">
                            <div className="icon absolute h-[40px] w-[40px] grid place-items-center top-0.5">
                              <CalendarRange strokeWidth={1.5} />
                            </div>
                            <div className="ml-[50px] flex flex-col">
                              <span className="font-[600] text-sm">
                                Check In
                              </span>
                              <div
                                className="w-full h-full block"
                                onClick={() =>
                                  setShowDatePicker((pv) => ({
                                    ...pv,
                                    active: !pv.active,
                                  }))
                                }
                              >
                                <span
                                  className={`ctx-unselected   ${!(form.dateRange[0] && form.dateRange[1]) &&
                                    "text-neutral-500"
                                    }`}
                                >
                                  {form.dateRange[0]
                                    ? moment(
                                      form.dateRange[0]
                                    ).format("MMM D")
                                    : "--"}{" "}
                                </span>
                              </div>
                            </div>
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
                            </AnimatePresence>
                          </div>
                          <div className="input-box relative py-1 flex-1">
                            <div className="icon absolute h-[40px] w-[40px] grid place-items-center top-0.5">
                              <CalendarRange strokeWidth={1.5} />
                            </div>
                            <div className="ml-[50px] flex flex-col">
                              <span className="font-[600] text-sm">
                                Check Out
                              </span>
                              <div
                                className="w-full h-full block"
                                onClick={() =>
                                  setShowDatePicker((pv) => ({
                                    ...pv,
                                    active: !pv.active,
                                  }))
                                }
                              >
                                <span
                                  className={`ctx-unselected   ${!(form.dateRange[0] && form.dateRange[1]) &&
                                    "text-neutral-500"
                                    }`}
                                >
                                  {form.dateRange[1]
                                    ? moment(
                                      form.dateRange[1]
                                    ).format("MMM D")
                                    : "--"}{" "}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {form.errors.date && (
                          <span className="ml-[50px] text-xs text-red-600 mt-1">
                            {form.errors.date}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          onClick={() => handleFormSubmit()}
                          className="bg-orange-600 max-[1350px]:h-[50px] max-[1350px]:w-max text-white flex gap-5 justify-center items-center px-5 rounded-full ml-10 hover:bg-orange-700 transition-colors"
                        >
                          <Search size="20" /> Search
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`${geist.className} inputs w-[80%] text-black bg-white px-5 py-6 rounded-r-2xl rounded-bl-2xl max-[700px]:rounded-tr-[0px] flex gap-5 max-[1350px]:flex-col max-[1350px]:w-full`}
                    >
                      <div className="input-box relative py-1 flex-1">
                        <div className="icon absolute h-[40px] w-[40px] grid place-items-center top-0.5">
                          <Eye strokeWidth={1.5} />
                        </div>
                        <div className="ml-[50px] flex flex-col">
                          <span className="font-[600] text-sm">Experience</span>
                          <input
                            type="text"
                            placeholder="e.g. hiking, food tour, shopping"
                            className="w-full focus:outline-0 outline-0 text-sm"
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
                      <div className="input-box relative py-1 flex-1">
                        <div className="icon absolute h-[40px] w-[40px] grid place-items-center top-0.5">
                          <MapPin strokeWidth={1.5} />
                        </div>
                        <div className="ml-[50px] flex flex-col relative">
                          <span className="font-[600] text-sm">Location</span>
                          <input
                            type="text"
                            className="focus:outline-0 outline-0 text-sm"
                            placeholder="e.g. Tokyo, Paris, Cebu"
                            value={form.location}
                            onChange={handleLocationChange}
                            onFocus={() => setLocationInputFocused(true)}
                            onBlur={() =>
                              setTimeout(
                                () => setLocationInputFocused(false),
                                200
                              )
                            }
                          />
                          {form.errors.location && (
                            <span className="text-xs text-red-600 mt-1">
                              {form.errors.location}
                            </span>
                          )}
                          <AnimatePresence>
                            {locationInputFocused && (
                              <motion.div
                                initial={{
                                  opacity: 0,
                                  y: -10,
                                  scale: 0.95,
                                }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute -top-12 left-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-10 whitespace-nowrap"
                              >
                                <div className="flex items-center gap-2">
                                  <Info className="w-3 h-3" />
                                  <span>
                                    Leave empty and we'll find a location
                                    for you
                                  </span>
                                </div>
                                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                              </motion.div>
                            )}
                          </AnimatePresence>
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
                                          <span className="text-left">
                                            {loc}
                                          </span>
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

                      <div className="flex flex-col flex-1">
                        <div className="flex gap-5 relative max-[700px]:flex-col">
                          <div className="input-box relative py-1 flex-1">
                            <div className="icon absolute h-[40px] w-[40px] grid place-items-center top-0.5">
                              <CalendarRange strokeWidth={1.5} />
                            </div>
                            <div className="ml-[50px] flex flex-col">
                              <span className="font-[600] text-sm">
                                Check In
                              </span>
                              <div
                                className="w-full h-full block"
                                onClick={() =>
                                  setShowDatePicker((pv) => ({
                                    ...pv,
                                    active: !pv.active,
                                  }))
                                }
                              >
                                <span
                                  className={`ctx-unselected   ${!(form.dateRange[0] && form.dateRange[1]) &&
                                    "text-neutral-500"
                                    }`}
                                >
                                  {form.dateRange[0]
                                    ? moment(
                                      form.dateRange[0]
                                    ).format("MMM D")
                                    : "--"}{" "}
                                </span>
                              </div>
                            </div>
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
                                    maxDate={maxDateFromStart}
                                    value={form.dateRange}
                                    onChange={handleDateChange}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <div className="input-box relative py-1 flex-1">
                            <div className="icon absolute h-[40px] w-[40px] grid place-items-center top-0.5">
                              <CalendarRange strokeWidth={1.5} />
                            </div>
                            <div className="ml-[50px] flex flex-col">
                              <span className="font-[600] text-sm">
                                Check Out
                              </span>
                              <div
                                className="w-full h-full block"
                                onClick={() =>
                                  setShowDatePicker((pv) => ({
                                    ...pv,
                                    active: !pv.active,
                                  }))
                                }
                              >
                                <span
                                  className={`ctx-unselected   ${!(form.dateRange[0] && form.dateRange[1]) &&
                                    "text-neutral-500"
                                    }`}
                                >

                                  {form.dateRange[1]
                                    ? moment(
                                      form.dateRange[1]
                                    ).format("MMM D")
                                    : "--"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {form.errors.date && (
                          <span className="ml-[50px] text-xs text-red-600 mt-1">
                            {form.errors.date}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          onClick={() => handleFormSubmit()}
                          className="bg-orange-600 max-[1350px]:h-[50px] max-[1350px]:w-max text-white flex gap-5 justify-center items-center px-5 rounded-full ml-10 hover:bg-orange-700 transition-colors"
                        >
                          <Wrench size="20" /> Build
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="mt-20">
          <div className="ctx-container-vxt2">
            <div className="wrapper px-5">
              <h1 className="text-neutral-700 bg-neutral-200 w-max mx-auto rounded-full px-5 py-1 font-[600]">
                ABOUT US
              </h1>
              <p
                className={`text-neutral-600 text-center text-4xl ${geist.className} leading-[50px] mt-5`}
              >
                Discover{" "}
                <span className="text-black">your perfect vacation</span> with
                <span className="text-black"> Where Should I Vacation</span>.
                Our AI and partners{" "}
                <span className="text-black">
                  analyzes thousands of options
                </span>{" "}
                to deliver
                <span className="text-black"> custom itineraries</span>,
                <span className="text-black"> hotel and flight deals</span>, and
                experiences
                <span className="text-black"> tailored just for you</span>. We
                make
                <span className="text-black"> travel planning effortless</span>,
                <span className="text-black"> personalized</span>, and
                <span className="text-black"> fun</span>, while keeping
                everything else simple, intuitive, and hassle-free.
              </p>
              {/* <ScrollReveal
                baseOpacity={0}
                enableBlur={true}
                baseRotation={5}
                blurStrength={10}
              >
                Discover your perfect vacation with Where Should I Vacation. Our
                AI and partners analyzes thousands of options to deliver custom
                itineraries, hotel and flight deals, and experiences tailored
                just for you. We make travel planning effortless, personalized,
                and fun, while keeping everything else simple, intuitive, and
                hassle-free.
              </ScrollReveal> */}
            </div>
          </div>
        </section>
        <section className="mt-25 bg-neutral-50 py-15">
          <div className="ctx-container-vxt2">
            <div className="wrapper px-5">
              <h1 className="text-center text-3xl font-[300]">
                How does it work?
              </h1>

              <div className="max-w-6xl flex mx-auto mt-16 max-[1350px]:flex-col-reverse">
                {/* Modern Step Cards */}
                <div className="grid grid-cols-1 gap-8 mb-16">
                  {/* Step 1 */}
                  <motion.div
                    className="group relative"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    viewport={{ once: true, margin: "-300px" }}
                  >
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 h-full border border-blue-200/50 shadow-lg shadow-blue-500/10 group-hover:shadow-xl group-hover:shadow-blue-500/20 transition-all duration-300">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">
                            1
                          </span>
                        </div>
                        <div className="w-full h-px bg-gradient-to-r from-blue-300 to-transparent"></div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        Tell Us About You
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        Share your travel dreams, preferences, and ideal vibe.
                        The more we know, the more personalized your adventure
                        becomes.
                      </p>
                      <div className="mt-6 flex items-center text-blue-600 text-sm font-medium">
                        <span>Quick & Easy</span>
                        <svg
                          className="w-4 h-4 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </motion.div>

                  {/* Step 2 */}
                  <motion.div
                    className="group relative"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true, margin: "-300px" }}
                  >
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-3xl p-8 h-full border border-amber-200/50 shadow-lg shadow-amber-500/10 group-hover:shadow-xl group-hover:shadow-amber-500/20 transition-all duration-300">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">
                            2
                          </span>
                        </div>
                        <div className="w-full h-px bg-gradient-to-r from-amber-300 to-transparent"></div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        Generation Begins
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        Our intelligent system analyzes thousands of
                        destinations, hotels, and experiences to find perfect
                        matches for your style.
                      </p>
                      <div className="mt-6 flex items-center text-amber-600 text-sm font-medium">
                        <span>Smart Analysis</span>
                        <svg
                          className="w-4 h-4 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                    </div>
                  </motion.div>

                  {/* Step 3 */}
                  <motion.div
                    className="group relative"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    viewport={{ once: true, margin: "-300px" }}
                  >
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-8 h-full border border-orange-200/50 shadow-lg shadow-orange-500/10 group-hover:shadow-xl group-hover:shadow-orange-500/20 transition-all duration-300">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">
                            3
                          </span>
                        </div>
                        <div className="w-full h-px bg-gradient-to-r from-orange-300 to-transparent"></div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        Your Perfect Trip
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        Receive curated recommendations with the best hotels,
                        flights, and experiences—all tailored specifically for
                        you.
                      </p>
                      <div className="mt-6 flex items-center text-orange-600 text-sm font-medium">
                        <span>Ready to Book</span>
                        <svg
                          className="w-4 h-4 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Central Visual Element */}
                <motion.div
                  className="max-w-2xl mx-auto sticky top-24 self-start max-[1350px]:static"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: "circOut" }}
                  viewport={{ once: true, margin: "-300px" }}
                >
                  <div className="p-8">
                    <img
                      src="bts2.png"
                      alt="Travel Planning Process"
                      className="w-full max-w-md mx-auto"
                    />
                  </div>
                </motion.div>
              </div>
              <motion.div
                className="grid w-full max-w-6xl mx-auto grid-cols-4 gap-6 mt-16 max-[1350px]:grid-cols-2 max-[700px]:grid-cols-1"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    10k+
                  </div>
                  <div className="text-gray-600 font-medium text-sm">
                    Destinations Analyzed
                  </div>
                </div>
                <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    2 min
                  </div>
                  <div className="text-gray-600 font-medium text-sm">
                    Average Setup Time
                  </div>
                </div>
                <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                  <div className="text-3xl font-bold text-amber-600 mb-2">
                    98%
                  </div>
                  <div className="text-gray-600 font-medium text-sm">
                    Satisfaction Rate
                  </div>
                </div>
                <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    80%
                  </div>
                  <div className="text-gray-600 font-medium text-sm">
                    Savings on Flights and Hotels
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        <section className="itinerary-expl">
          <div className="ctx-container">
            <div className="wrapper px-5">
              <h1 className="text-4xl font-[300] text-center mt-20 max-[600px]:text-2xl">
                Your Trip, Designed for{" "}
                <span
                  className={`${cookie.className} text-[4rem] text-orange-600 `}
                >
                  you
                </span>
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
                  <ItineraryShowcase imageSrc="/itinerary-ex.png" />
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="pricing" id="pricing">
          <div className="ctx-container">
            <div className="wrapper mt-[100px] px-5">
              <h1 className="text-3xl font-[300] text-center max-[600px]:text-2xl">
                A pricing structure that is friendly
              </h1>
              <p className="text-center font-[500] text-neutral-700 mt-2">
                No subscriptions, no monthly fees — just pay for what you need,
                when you need it. Simple, transparent, and commitment-free.
              </p>
              <div className="pricing-structure grid grid-cols-3 gap-2 mt-10 max-[900px]:grid-cols-1">
                <div className="price-card bg-white  border-1 border-neutral-100 shadow-sm shadow-neutral-100 px-10 py-8 rounded-md">
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
                  <div className="price-card bg-white  border-1 text-white border-neutral-100 shadow-sm shadow-neutral-100 px-10 py-8 rounded-md bg-gradient-to-b from-orange-600 to-blue-500 scale-110 z-10 max-[900px]:scale-100">
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
                <div className="price-card bg-white  border-1 border-neutral-100 shadow-sm shadow-neutral-100 px-10 py-8 rounded-md">
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
        <div className="pt-10 pb-25">
          <FAQAccordion />
        </div>
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
    <div className="mx-auto mt-20 px-5" id="faq">
      <h1 className="text-3xl font-[300] text-center max-[600px]:text-2xl">
        Frequently Asked Questions
      </h1>
      <p className="text-center font-[500] text-neutral-700 mt-2">
        Got questions? We've answered the most common ones below to help you
        plan with confidence — clear, honest, and upfront.
      </p>
      <ul className="grid grid-cols-2 gap-2 max-w-5xl mx-auto mt-10 max-[900px]:grid-cols-1 ">
        {faqs.map((faq, idx) => (
          <li key={faq.q}>
            <button
              className={`w-full flex justify-between items-center px-0 py-3 font-[600] text-left transition-colors ${openIndices.includes(idx)
                ? "text-orange-600"
                : "hover:text-orange-600 text-neutral-800"
                }`}
              onClick={() => handleToggle(idx)}
              aria-expanded={openIndices.includes(idx)}
              aria-controls={`faq-panel-${idx}`}
              type="button"
              style={{ background: "none", border: "none", outline: "none" }}
            >
              <span className="text-lg max-[800px]:text-base">{faq.q}</span>
              <span
                className={`ml-4 transition-transform duration-200 ${openIndices.includes(idx)
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
                  <div className="pl-0 pr-8 pb-4 pt-1 text-neutral-700 max-[800px]:text-sm">
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
