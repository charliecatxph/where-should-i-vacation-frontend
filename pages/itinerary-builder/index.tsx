import Footer from "@/components/Footer";
import { Header } from "@/components/Header";

import { Anton, Geist, Inter } from "next/font/google";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { DatePicker } from "@mantine/dates";
import { Info, Search, Wrench } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import axios from "axios";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import { useQueryClient } from "@tanstack/react-query";
import { useClickOutside } from "@/hooks/UseClickOutside";
import {
  selectUserData,
  isUserDataComplete,
  setUser,
} from "@/redux/features/user";
import { GetServerSidePropsContext } from "next";
import { authGate } from "@/authentication/authGate";
// REMOVE: import { useModal } from "@/components/modals/ModalContext";

// --- Add types for form state ---
type DateRangeType = [Date | string | null, Date | string | null];
type FormState = {
  activity: string;
  location: string;
  dateRange: DateRangeType;
  errors: {
    activity?: string;
    location?: string;
    date?: string;
  };
};

const inter = Inter({ subsets: ["latin"] });
const geist = Geist({ subsets: ["latin"] });

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const udc = await authGate(ctx);
  return udc;
};

export default function ItineraryBuilder({ user, api }: any) {
  const dispatch = useDispatch();
  const userData = useSelector(selectUserData);

  const router = useRouter();

  // ---- USER DATA REDUX CONDITIONAL ---
  const userData__final = isUserDataComplete(userData) ? userData : user;
  useEffect(() => {
    if (!user) return;
    dispatch(setUser(user));
  }, [user]);

  const navButtons = [
    { name: "Ordinary Generation", route: "/" },
    { name: "How It Works", route: "/itinerary" },
    { name: "Itinerary History", route: "/itinerary-history" },
    { name: "Contact", route: "/#contact" },
  ];

  // Animation state for header
  const [isOutOfBounds, setIsOutOfBounds] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkBounds = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        // If the bottom of the custom header is above -50px (50px out of view), it's out of bounds
        if (rect.bottom < -100) {
          setIsOutOfBounds(true);
        } else {
          setIsOutOfBounds(false);
        }
      }
    };
    window.addEventListener("scroll", checkBounds);
    window.addEventListener("resize", checkBounds);
    checkBounds();
    return () => {
      window.removeEventListener("scroll", checkBounds);
      window.removeEventListener("resize", checkBounds);
    };
  }, []);

  const travelImages = [
    "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1170&q=80",
    "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1170&q=80",
  ];
  const [randomImage, setRandomImage] = useState(travelImages[0]);
  useEffect(() => {
    setRandomImage(
      travelImages[Math.floor(Math.random() * travelImages.length)]
    );
    // Optionally, randomize on mount only. If you want to randomize on every render, remove the dependency array.
  }, []);

  // Local popup state
  const [showPreferencesPopup, setShowPreferencesPopup] = useState(false);
  const [pendingParams, setPendingParams] = useState<URLSearchParams | null>(
    null
  );
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

  // Grouped preferences (flat row, but visually grouped)
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

  // Show date picker on focus
  const [showDatePicker, setShowDatePicker] = useState({
    active: false,
    start: null,
    end: null,
  });
  const datePickerRef = useClickOutside<HTMLDivElement>(() =>
    setShowDatePicker((pv) => ({ ...pv, active: false }))
  );

  // Global state for form
  const [form, setForm] = useState<FormState>({
    activity: "",
    location: "",
    dateRange: [null, null],
    errors: {},
  });

  // Show form on input focus
  const [locationInputFocused, setLocationInputFocused] = useState(false);

  // Debounce location input
  type LocationDataType = {
    results: any[];
    loading: boolean;
    error: unknown | null;
  };
  const [debouncedLocation, setDebouncedLocation] = useState(form.location);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLocation(form.location);
    }, 300);
    return () => clearTimeout(handler);
  }, [form.location]);

  // Search aggregation query
  const [locationData, setLocationData] = useState<LocationDataType>({
    results: [],
    loading: false,
    error: null,
  });
  const queryClient = useQueryClient();

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

  // Handle activity input
  const handleActivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      activity: value,
      errors: { ...prev.errors, activity: undefined },
    }));
  };

  // Handle location input
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Modularized date parser
  const getDateObj = (d: Date | string | null) => {
    if (!d) return null;
    if (typeof d === "string") return new Date(d);
    return d;
  };

  // Dynamically cap the selectable date range to 7 days after the chosen start date
  const maxDateFromStart: Date | undefined = (() => {
    const startDate = getDateObj(form.dateRange[0]);
    if (!startDate) return undefined;
    const max = new Date(startDate);
    max.setDate(max.getDate() + 7);
    return max;
  })();

  // Form submit handler
  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
    setPendingParams(params);
    setShowPreferencesPopup(true);
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

  return (
    <>
      <AnimatePresence>
        {isOutOfBounds && (
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 100 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              zIndex: 10000,
            }}
          >
            <Header userData__final={userData__final} navButtons={navButtons} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPreferencesPopup && (
          <motion.div
            className="fixed inset-0 z-[9999999999999] flex items-center justify-center bg-neutral-900/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="items-end bg-white rounded-2xl shadow-2xl flex flex-col p-8 relative max-w-[600px]"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <h2 className="text-2xl font-bold mb-2 text-center w-full">
                What do you prefer?
              </h2>
              <p className="text-gray-600 mb-4 text-center w-full">
                Select as many as you like to help us personalize your trip.
              </p>
              <div className="flex flex-col gap-2 w-full flex-1">
                <div className="flex flex-row flex-wrap gap-x-8 gap-y-4 items-start w-full">
                  {preferenceGroups.map((group) => (
                    <div
                      key={group.label}
                      className="flex flex-col min-w-[180px]"
                    >
                      <span className="font-semibold text-sm text-orange-600 mb-1 mt-2">
                        {group.label}
                      </span>
                      <div className="flex flex-row flex-wrap gap-2">
                        {group.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            className={`px-4 py-2 rounded-full border transition-all duration-200 text-sm font-medium shadow-sm focus:outline-none
                              ${
                                selectedPreferences.includes(opt)
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
              <div className="flex gap-2 mt-5">
                <button
                  onClick={handlePreferencesConfirm}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-lg transition-all"
                >
                  Confirm
                </button>
                <button
                  onClick={handlePreferencesCancel}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <main className={`${inter.className}`}>
        <header
          ref={headerRef}
          className="absolute top-0 z-[999] w-full text-white"
        >
          <div className="w-full main-header mt-10">
            <div className="ctx-container-itinerary">
              <div className="wrapper flex justify-between py-[5px] px-8">
                <div className="logo">
                  <Link href="/">
                    <img src="wta-white.svg" alt="" className="w-[140px]" />
                  </Link>
                </div>
                <ul className="action-buttons flex gap-2 items-center font-[500] text-sm max-[1000px]:hidden">
                  {navButtons.map((btn) => (
                    <li key={btn.route}>
                      <Link href={btn.route}>
                        <button className="select-none px-3 text-sm font-[600] hover:text-neutral-200 transition-colors">
                          {btn.name}
                        </button>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="usr max-[500px]:hidden">
                  {userData__final ? (
                    <p className="text-sm font-[500]">
                      Signed in as {userData__final.name}
                    </p>
                  ) : (
                    <div className="authentication flex gap-2 text-white font-[500] text-sm">
                      <button className="px-2">Sign In</button>
                      <button className="pl-2">Register</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
        <section className="hero h-screen max-h-[700px] relative">
          <div className="bg absolute top-0 h-full w-full z-[-1]">
            <div className="m-3 rounded-lg overflow-hidden h-full relative">
              <img
                src={randomImage}
                alt="Random travel inspiration"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-b from-black/50 to-transparent"></div>
            </div>
          </div>
          <div className="text-white relative h-full">
            <div className="ctx-container-itinerary h-full">
              <div className="wrapper pt-[300px] h-full flex justify-between flex-col px-8 max-[600px]:pt-[250px]">
                <div>
                  <h1 className="text-6xl font-[700] tracking-tighter max-[1000px]:text-5xl">
                    Hey, it's your trip. Let's make it perfect.
                  </h1>
                  <p className="mt-4 text-xl font-[500] text-muted-foreground max-w-xl max-[1000px]:text-lg">
                    No templates. No tourist traps. Just real experiences built
                    around what you love — the way travel should be.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative top-[-20%] w-full">
            <div className="ctx-container-itinerary">
              <div className="wrapper px-8">
                <div className="under-buttons mb-10 flex justify-between gap-6 mt-10 h-[200px] max-[800px]:flex-col">
                  <div className="box w-full bg-white px-10 py-8 rounded-lg border-1 border-neutral-200 h-full flex justify-between flex-col">
                    <div>
                      <h1 className="font-[700] text-xl">Your Activity</h1>
                      <p>What do you want to do?</p>
                    </div>
                    <input
                      type="text"
                      className="border-b-1 focus:outline-none w-full mt-5 border-neutral-300 pb-2"
                      placeholder="e.g. hiking, food tour, shopping"
                      value={form.activity}
                      onChange={handleActivityChange}
                    />
                    {form.errors.activity && (
                      <span className="text-xs text-red-600 mt-1">
                        {form.errors.activity}
                      </span>
                    )}
                  </div>
                  <div className="box w-full bg-white px-10 py-8 rounded-lg border-1 border-neutral-200 h-full flex justify-between flex-col relative">
                    <div>
                      <h1 className="font-[700] text-xl">Location</h1>
                      <p>Where do you want it?</p>
                    </div>
                    <input
                      type="text"
                      className="border-b-1 focus:outline-none w-full mt-5 border-neutral-300 pb-2"
                      placeholder="e.g. Tokyo, Paris, Cebu"
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
                      <div className="absolute top-full bg-white z-[3] rounded-b-2xl border-1 border-neutral-100 shadow-sm shadow-neutral-100">
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
                  <div className="box w-full bg-white px-10 py-8 rounded-lg border-1 border-neutral-200 h-full flex justify-between flex-col relative">
                    <div>
                      <h1 className="font-[700] text-xl">When</h1>
                      <p>When do you want to do this?</p>
                    </div>
                    <button
                      type="button"
                      className="border-b-1 focus:outline-none w-full mt-5 border-neutral-300 pb-2 text-left"
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
                          : "--"}
                        {" / "}
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
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
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
                      {form.errors.date && (
                        <span className="text-xs text-red-600 mt-1">
                          {form.errors.date}
                        </span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="w-[200px] max-[1000px]:w-full flex justify-center items-center">
                    <button
                      className="text-white bg-orange-600 w-[60px] h-[60px] max-[800px]:w-full  rounded-lg flex items-center gap-5 justify-center"
                      onClick={handleFormSubmit}
                    >
                      <Wrench />{" "}
                      <span className="font-[500] hidden max-[800px]:block">
                        Build My Itinerary
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="itinerary-expl mt-40 max-[800px]:mt-[600px]">
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
      </main>
      <Footer />
    </>
  );
}
