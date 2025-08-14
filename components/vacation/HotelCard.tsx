import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Anton, Inter } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const inter = Inter({ subsets: ["latin"] });
const anton = Anton({ weight: "400", subsets: ["latin"] });

interface HotelCardParameters {
  placeData: any;
  hotel: any;
  i: number;
}

const haversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): string => {
  const toRadians = (deg: number) => deg * (Math.PI / 180);
  const R = 6371e3;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  // sin²((lat2 - lat1)/2) + cos(lat1) * cos(lat2) * sin²((lng2 - lng1)/2)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  // asin(=> sqrt())
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceInMeters = R * c;

  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}m`;
  } else {
    return `${(distanceInMeters / 1000).toFixed(1)}km`;
  }
};

const HotelDropdown = ({
  isOpen,
  onToggle,
  buttonRef,
  hotel,
  buttonIndex,
}: {
  isOpen: boolean;
  onToggle: () => void;
  buttonRef: React.MutableRefObject<{
    [key: number]: HTMLButtonElement | null;
  }>;
  hotel: any;
  buttonIndex: number;
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const currentButton = buttonRef.current[buttonIndex];
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        currentButton &&
        !currentButton.contains(event.target as Node)
      ) {
        onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onToggle, buttonRef, buttonIndex]);

  const getDropdownPosition = () => {
    const currentButton = buttonRef.current[buttonIndex];
    if (!currentButton) return { top: 0, left: 0 };

    const rect = currentButton.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY + 5,
      left: rect.left + window.scrollX,
      width: rect.width,
    };
  };

  const position = getDropdownPosition();
  const encodedName = encodeURIComponent(hotel.displayName);

  const bookingOptions = [
    {
      name: "Booking.com",
      url: `https://www.booking.com/searchresults.html?ss=${encodedName}`,
    },
  ];

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.15 }}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 1000,
      }}
      className={`${inter.className} bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[250px]`}
    >
      {bookingOptions.map((option, index) => (
        <button
          key={option.name}
          onClick={() => {
            window.open(option.url, "_blank");
            onToggle();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between"
        >
          <span>Book with {option.name}</span>
        </button>
      ))}
    </motion.div>,
    document.body
  );
};

const HotelRating = ({ rating }: { rating: number }) => {
  if (rating < 0 || rating > 5) return null;

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      <span className="text-yellow-400">
        {"★".repeat(fullStars)}
        {hasHalfStar && "☆"}
        {"☆".repeat(emptyStars)}
      </span>
      <span className="text-sm">{rating.toFixed(1)}/5</span>
    </div>
  );
};

export default function HotelCard({
  placeData,
  hotel,
  i,
}: HotelCardParameters) {
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const dropdownButtonRefs = useRef<{
    [key: number]: HTMLButtonElement | null;
  }>({});

  // Compute distance thru haversine p1-p2
  // d = 2 * R * asin(sqrt(sin²((lat2 - lat1)/2) + cos(lat1) * cos(lat2) * sin²((lng2 - lng1)/2)))

  return (
    <motion.div
      key={hotel.displayName || i}
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.6,
        delay: i * 0.2,
        ease: "easeOut",
      }}
      className="snap-center  relative h-[400px] w-[500px] max-[800px]:w-full shrink-0 overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
    >
      <img
        src={hotel.photos?.[0]?.secure_url ?? ""}
        alt={hotel.photos?.[0]?.secure_url ? hotel.displayName : "No photo."}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <span className="text-xs mb-1">
          {haversineDistance(
            placeData.location.latitude,
            placeData.location.longitude,
            hotel.location.latitude,
            hotel.location.longitude
          )}{" "}
          away
        </span>
        <h3 className={`${anton.className} text-2xl mb-2`}>
          {hotel.displayName}
        </h3>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HotelRating rating={parseFloat(hotel.rating) || 0} />
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold">${hotel.estimatedPrice}</span>
            <span className="text-sm opacity-75">/night</span>
          </div>
        </div>

        <div className="flex justify-between items-center relative">
          <div className="flex items-center gap-2 mb-4 text-sm opacity-75 basis-1/2">
            <span>📍 {hotel.formattedAddress.slice(0, 60)}</span>
          </div>
          <button
            ref={(el) => {
              dropdownButtonRefs.current[i] = el;
            }}
            onClick={() => setOpenDropdown(openDropdown === i ? null : i)}
            className="bg-white px-4 py-1 rounded-lg text-black flex justify-between items-center gap-2 hover:bg-neutral-100 transition-all duration-200"
          >
            <span className="font-semibold text-sm">Book Now</span>
            <motion.div
              animate={{
                rotate: openDropdown === i ? 180 : 0,
              }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown />
            </motion.div>
          </button>
          <HotelDropdown
            isOpen={openDropdown === i}
            onToggle={() => setOpenDropdown(openDropdown === i ? null : i)}
            buttonRef={dropdownButtonRefs}
            hotel={hotel}
            buttonIndex={i}
          />
        </div>
      </div>
    </motion.div>
  );
}
