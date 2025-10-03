import { AnimatePresence, motion } from "framer-motion";
import { TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import HotelCard from "./HotelCard";
import { Inter } from "next/font/google";

interface HotelSwiperParameters {
  hotelsLoading: boolean;
  hotelsData: any;
  placeData: any;
  dates: string;
}

const inter = Inter({ subsets: ["latin"] });

const LoadingSpinner = () => {
  const messages = [
    "Finding amazing hotels for you...",
    "Searching for the best accommodations...",
    "Curating perfect hotel options...",
    "Locating top-rated properties...",
    "Finding your ideal stay...",
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

export default function HotelSwiper({
  hotelsLoading,
  hotelsData,
  placeData,
  dates,
}: HotelSwiperParameters) {
  return (
    <section className="hotel-swiper">
      <AnimatePresence>
        {hotelsLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="ctx-container">
              <div className="wrapper px-5">
                <h1 className="text-3xl font-[800] text-center mt-10 max-[800px]:text-2xl  max-[400px]:text-xl">
                  Accomodation
                </h1>
                <p className="text-center font-[500] text-neutral-700 mt-1  max-[400px]:text-[0.9rem]">
                  Here are some hotels near to {placeData?.displayName?.text},
                  arranged by price.
                </p>
              </div>
            </div>
            <div className="flex justify-center text-sm font-[500] mt-5 px-5">
              <div className="items-center flex align-center gap-2 bg-yellow-100 text-yellow-700 py-1.5 px-5 rounded-full max-[800px]:text-xs">
                <TriangleAlert size="18px" className="shrink-0" />
                <span>
                  Prices are estimated and may vary depending on demand,
                  availability, and season.
                </span>
              </div>
            </div>
            <div className="wrapper w-screen hotel-swiper-parent flex gap-5 overflow-x-scroll overflow-y-hidden pr-5 scroll-smooth snap-x  mt-5">
              <div className="first-hotel-swiper"></div>
              {hotelsData &&
                hotelsData
                  .sort((a: any, b: any) => a.estimatedPrice - b.estimatedPrice)
                  .map((hotel: any, i: number) => {
                    return (
                      <HotelCard placeData={placeData} hotel={hotel} i={i} dates={dates} />
                    );
                  })}
            </div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
