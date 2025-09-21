import { FC } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Link from "next/link";

interface PlaceCardProps {
  id: string;
  images: { url: string; author: string }[];
  name: string;
  location: string;
  mapsUrl: string;
  placeUrl: string;
  dates: string;
  tmpReferrer: string;
}

export const PlaceCard: FC<PlaceCardProps> = ({
  id,
  images,
  name,
  location,
  mapsUrl,
  placeUrl,
  dates,
  tmpReferrer,
}) => {
  return (
    <div className="rounded-xl shadow-md shadow-neutral-100 bg-white overflow-hidden w-full mx-auto transition-transform">
      <div className="relative">
        <Swiper
          pagination={{ clickable: true }}
          modules={[Pagination]}
          className="w-full h-[220px]"
        >
          {images.map((img, idx) => (
            <SwiperSlide key={idx}>
              <div className="relative w-full h-[220px]">
                <img
                  src={img.url}
                  alt={name}
                  className="object-cover w-full h-full"
                  style={{ aspectRatio: "16/9" }}
                />
                <span className="absolute bottom-2 right-3 bg-black/60 text-xs text-white px-2 py-1 rounded-full z-10 shadow-md">
                  Photo by {img.author}
                </span>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <div className="p-4 pb-3">
        <h2
          className="text-lg font-bold text-orange-600 mb-0.5 truncate"
          title={name}
        >
          {name}
        </h2>
        <p
          className="text-sm text-neutral-700 mb-2 flex items-center gap-1 truncate"
          title={location}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path
              fill="#fb923c"
              d="M12 2C7.03 2 3 6.03 3 11c0 5.25 7.11 10.61 8.13 11.36.53.39 1.21.39 1.74 0C13.89 21.61 21 16.25 21 11c0-4.97-4.03-9-9-9zm0 17.88C10.07 18.13 5 13.97 5 11c0-3.87 3.13-7 7-7s7 3.13 7 7c0 2.97-5.07 7.13-7 8.88z"
            />
            <circle cx="12" cy="11" r="2.5" fill="#fb923c" />
          </svg>
          {location}
        </p>
        <div className="flex gap-2 mt-10">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-white border border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold py-2 px-2 rounded-md text-center text-sm transition"
          >
            View this Place
          </a>
          <Link
            href={`/vacation?place=${id}&dates=${dates}&ref=${tmpReferrer}`}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-2 rounded-md text-center text-sm transition"
          >
            Explore
          </Link>
        </div>
      </div>
    </div>
  );
};

export const PlaceCardSkeleton: FC = () => (
  <div className="rounded-xl shadow-md shadow-neutral-100 bg-white overflow-hidden w-full mx-auto ">
    <div className="relative w-full h-[220px] loading-skeleton"></div>
    <div className="p-4 pb-3">
      <div className="h-6 w-2/3 rounded mb-1 loading-skeleton" />
      <div className="h-4 w-1/3 rounded mb-2 loading-skeleton" />
      <div className="flex gap-2 mt-2">
        <div className="flex-1 h-9 rounded-full loading-skeleton" />
        <div className="flex-1 h-9 rounded-full loading-skeleton" />
      </div>
    </div>
  </div>
);

export default PlaceCard;
