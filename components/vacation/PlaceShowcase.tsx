import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { Anton, Inter } from "next/font/google";

const anton = Anton({ weight: "400", subsets: ["latin"] });
const inter = Inter({ subsets: ["latin"] });

interface PlaceShowcaseParameters {
  placeData: any;
}

export default function PlaceShowcase({ placeData }: PlaceShowcaseParameters) {
  return (
    <section className="place-showcase">
      <div className="bg-ctx relative">
        {placeData && placeData.photos && placeData.photos.length > 0 && (
          <Swiper
            pagination={false}
            modules={[Pagination]}
            className="w-full h-[400px]"
          >
            {placeData.photos.map((img: any, idx: number) => (
              <SwiperSlide key={idx}>
                <div className="relative w-full h-full">
                  <img
                    src={img.secure_url}
                    alt={placeData.displayName?.text || "Place"}
                    className="object-cover w-full h-full"
                    style={{ aspectRatio: "16/9" }}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}

        {/* Gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20"></div>

        {/* Place information overlay */}
        {placeData && (
          <div className="absolute bottom-0 left-0 right-0 p-8 z-30">
            <div className="ctx-container">
              <div className="wrapper">
                <h1
                  className={`${anton.className} text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-2 drop-shadow-lg`}
                >
                  {placeData.displayName?.text || "Place"}
                </h1>
                {typeof placeData.rating === "number" && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-400 text-xl">★</span>
                    <span className="text-white text-lg font-semibold">
                      {placeData.rating.toFixed(1)}
                    </span>
                    <span className="text-white/70 text-sm">/ 5.0</span>
                  </div>
                )}
                <p
                  className={`${inter.className} text-white/90 text-lg md:text-xl drop-shadow-md`}
                >
                  {placeData.formattedAddress || "Location"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="ctx-container">
        <div className="wrapper grid grid-cols-1 gap-8 mt-5">
          <div className="flex-1 flex flex-col gap-6">
            {/* Description */}
            {placeData?.description && (
              <div className=" rounded-lg p-4">
                <h1 className="text-3xl font-[800] text-center mt-5 max-[800px]:text-2xl">
                  About {placeData?.displayName?.text}
                </h1>
                <p className="text-neutral-700 text-base text-center mt-2">
                  {placeData.description}
                </p>
              </div>
            )}
          </div>
          {placeData && placeData.photos && placeData.photos.length > 0 && (
            <div className="flex items-baseline gap-2 px-5">
              {placeData.photos.map((img: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-lg w-[300px] overflow-hidden shadow-sm shadow-neutral-100"
                  style={{
                    aspectRatio: "16/9",
                  }}
                >
                  <img
                    src={img.secure_url}
                    alt={placeData.displayName?.text || `Place ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
