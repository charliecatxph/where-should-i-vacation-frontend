import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, HomeIcon, MapPin } from "lucide-react";
import Portal from "./Portal";

interface ActivityLike {
  id?: string;
  displayName?: { text?: string } | null;
  description?: string | null;
  formattedAddress?: string | null;
  userAction?: string | null;
  rating?: number | null;
  timeInOut?: string | null;
  photos?: Array<{ secure_url?: string | null } | null> | null;
}

type MapPinType = "ACTIVITY" | "HOTEL";

interface CustomCTXMapPinGMAPSProps {
  activity: ActivityLike;
  type: MapPinType;
}

const fallbackImg = "/itinerary-ex.png";

export default function CustomCTXMapPinGMAPS({
  activity,
  type,
}: CustomCTXMapPinGMAPSProps) {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [detailsPos, setDetailsPos] = useState<{ left: number; top: number } | null>(null);

  const imgSrc = useMemo(() => {
    const src = activity?.photos?.[0]?.secure_url || fallbackImg;
    return src || fallbackImg;
  }, [activity]);

  const title = activity?.displayName?.text || "Untitled";

  // Click outside to close
  useEffect(() => {
    if (!clicked) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        detailsRef.current &&
        !detailsRef.current.contains(e.target as Node)
      ) {
        setClicked(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [clicked]);

  // Update fixed position for the details card (portal) relative to the pin
  useEffect(() => {
    if (!clicked) return;
    const updatePosition = () => {
      const el = pinRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Place card above the icon with small padding (12px)
      setDetailsPos({ left: rect.left + rect.width / 2, top: rect.top - 12 });
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [clicked]);

  return (
    <div className="relative">
      {/* Custom orange pin */}
      <div
        ref={pinRef}
        className="relative cursor-pointer z-[1]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => {
          setClicked((prev) => {
            const next = !prev;
            if (!prev) {
              const el = pinRef.current;
              if (el) {
                const rect = el.getBoundingClientRect();
                // Initial compute: same logic as effect (12px above icon)
                setDetailsPos({ left: rect.left + rect.width / 2, top: rect.top - 12 });
              }
            }
            return next;
          });
        }}
      >
        <div className="relative flex items-center justify-center">
          {type === "ACTIVITY" ? (
            <Eye
              size={32}
              fill={"#ea580c"}
              stroke="#ffffff"
              strokeWidth={2}
              className="drop-shadow-lg"
            />
          ) : (
            <HomeIcon
              size={32}
              fill={"#000000"}
              stroke="#ffffff"
              strokeWidth={2}
              className="drop-shadow-lg"
            />
          )}
        </div>

        {/* Hover: circular image preview */}
        <AnimatePresence>
          {hovered && !clicked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[999]"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-orange-500 shadow-xl bg-white">
                <img
                  src={imgSrc}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.currentTarget as HTMLImageElement;
                    if (el.src !== fallbackImg) el.src = fallbackImg;
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click: full details card (portal to escape map stacking/overflow) */}
      <AnimatePresence>
        {clicked && detailsPos && (
          <Portal>
            <motion.div
              ref={detailsRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{ position: "fixed", left: detailsPos.left, top: detailsPos.top }}
              className="-translate-x-1/2 -translate-y-full z-[2147483647]"
            >
              <div className="w-72 rounded-xl overflow-hidden shadow-2xl border border-neutral-200 bg-white">
                <div className="relative h-40 w-full bg-neutral-100">
                  <img
                    src={imgSrc}
                    alt={`${title} Photo`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const el = e.currentTarget as HTMLImageElement;
                      if (el.src !== fallbackImg) el.src = fallbackImg;
                    }}
                  />
                  {activity?.timeInOut && (
                    <span className="absolute top-2 left-2 text-xs bg-orange-600 text-white px-2 py-1 rounded-full bg-opacity-90">
                      {activity.timeInOut}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-base leading-tight">
                      {title}
                    </p>
                    {typeof activity?.rating === "number" && (
                      <span className="text-sm text-orange-600 shrink-0">
                        ★ {activity.rating?.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {activity?.formattedAddress && (
                    <p className="text-sm text-neutral-600 mt-2">
                      {activity.formattedAddress}
                    </p>
                  )}
                  {activity?.description && (
                    <p className="text-sm text-neutral-700 mt-2 line-clamp-3">
                      {activity.description}
                    </p>
                  )}
                  {activity?.userAction && (
                    <p className="text-xs text-neutral-600 mt-2">
                      Suggested: {activity.userAction}
                    </p>
                  )}
                  <div className="mt-4">
                    {activity?.id && (
                      <a
                        href={`https://www.google.com/maps/place/?q=place_id:${activity.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-2 px-4 rounded-lg text-sm"
                      >
                        View on Google Maps
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Pointer triangle */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full">
                <div className="w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white drop-shadow"></div>
              </div>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
}
