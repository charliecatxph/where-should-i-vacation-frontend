import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import { Anton, Inter } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Star, Camera, Info, Clock, Users } from "lucide-react";
import { useState } from "react";

const anton = Anton({ weight: "400", subsets: ["latin"] });
const inter = Inter({ subsets: ["latin"] });

interface PlaceShowcaseParameters {
  placeData: any;
}

export default function PlaceShowcase({ placeData }: PlaceShowcaseParameters) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showImageGrid, setShowImageGrid] = useState(false);

  return (
    <section className="place-showcase relative overflow-hidden">
      {/* Hero Section with Enhanced Image Display */}
      <div className="relative h-[70vh] min-h-[500px]">
        {placeData && placeData.photos && placeData.photos.length > 0 && (
          <Swiper
            pagination={{
              clickable: true,
              bulletClass: 'swiper-pagination-bullet !bg-white/50 !w-3 !h-3',
              bulletActiveClass: 'swiper-pagination-bullet-active !bg-white !scale-125'
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            modules={[Pagination, Autoplay, EffectFade]}
            className="w-full h-full"
            onSlideChange={(swiper) => setActiveImageIndex(swiper.activeIndex)}
          >
            {placeData.photos.map((img: any, idx: number) => (
              <SwiperSlide key={idx}>
                <div className="relative w-full h-full">
                  <img
                    src={img.secure_url}
                    alt={placeData.displayName?.text || "Place"}
                    className="object-cover w-full h-full scale-105 transition-transform duration-[8000ms]"
                  />
                  {/* Parallax overlay effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}



        {/* Enhanced Place Information */}
        {placeData && (
          <div className="absolute bottom-0 left-0 right-0 z-30">
            <div className="ctx-container">
              <div className="wrapper pb-12 px-5">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="space-y-4"
                >
                  {/* Location Badge */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 text-white/90 border border-white/20"
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium max-[600px]:text-xs">
                      {placeData.formattedAddress || "Location"}
                    </span>
                  </motion.div>

                  {/* Main Title */}
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`${anton.className} text-white text-2xl md:text-4xl lg:text-5xl font-bold leading-tight drop-shadow-2xl`}
                  >
                    {placeData.displayName?.text || "Place"}
                  </motion.h1>

                  {/* Rating and Stats */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center gap-6 flex-wrap"
                  >
                    {typeof placeData.rating === "number" && (
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-white text-lg font-bold max-[600px]:text-sm">
                          {placeData.rating.toFixed(1)}
                        </span>
                        <span className="text-white/70 text-sm">/ 5.0</span>
                      </div>
                    )}

                    {placeData.userRatingCount && (
                      <div className="flex items-center gap-2 text-white/80">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">
                          {placeData.userRatingCount.toLocaleString()} reviews
                        </span>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Content Section with Modern Cards */}
      <div className="ctx-container py-16">
        <div className="wrapper px-5">
          {/* Description Card */}
          {placeData?.description && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 mb-12"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="shrink-0 w-12 h-12 max-[600px]:w-10 max-[600px]:h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
                  <Info className="w-6 h-6 text-white max-[600px]:w-4 max-[600px]:h-4" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 max-[800px]:text-2xl max-[600px]:text-xl">
                  {placeData?.displayName?.text}
                </h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed max-[600px]:text-sm">
                {placeData?.description || ""}
              </p>
            </motion.div>
          )}

          {/* Interactive Photo Gallery */}
          {placeData && placeData.photos && placeData.photos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}

            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Photo Gallery</h3>
                <span className="text-gray-500 text-sm">
                  {placeData.photos.length} photos
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {placeData.photos.slice(0, 6).map((img: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="group relative rounded-2xl overflow-hidden shadow-lg shadow-gray-200/50 cursor-pointer"
                    style={{ aspectRatio: "4/3" }}
                  >
                    <img
                      src={img.secure_url}
                      alt={placeData.displayName?.text || `Place ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 text-white">
                        <p className="text-sm font-medium">Photo {idx + 1}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {placeData.photos.length > 6 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-8 mx-auto block bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300"
                  onClick={() => setShowImageGrid(true)}
                >
                  View All {placeData.photos.length} Photos
                </motion.button>
              )}
            </motion.div>
          )}
        </div>
      </div>


    </section>
  );
}
