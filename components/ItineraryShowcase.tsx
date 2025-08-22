import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircularProgress } from "@mui/material";
import { Check } from "lucide-react";
import TextType from "./animatronix/TextType";

const defaultTags = [
  { label: "Adventure", className: "bg-blue-100 text-blue-700" },
  { label: "All", className: "bg-gray-100 text-gray-700" },
  { label: "Foodie", className: "bg-green-100 text-green-700" },
  { label: "Culture", className: "bg-pink-100 text-pink-700" },
  { label: "Romance", className: "bg-cyan-100 text-cyan-700" },
];

export interface ItineraryShowcaseProps {
  imageSrc: string;
  imageAlt?: string;
  tags?: { label: string; className: string }[];
  animationTiming?: {
    typing?: number;
    progress?: number;
    check?: number;
  };
  chatHeadStyle?: React.CSSProperties;
  imageStyle?: React.CSSProperties;
}

const ItineraryShowcase: React.FC<ItineraryShowcaseProps> = ({
  imageSrc,
  imageAlt = "Itinerary Example",
  tags = defaultTags,
  animationTiming = { typing: 6000, progress: 2000, check: 1000 },
  chatHeadStyle = {},
  imageStyle = {},
}) => {
  const [animStage, setAnimStage] = useState("idle"); // "idle" | "typing" | "progress" | "check" | "done"
  const [showItinerary, setShowItinerary] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer to trigger animation when 50% in viewport
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    if (animStage !== "idle") return; // Only observe if not started

    observerRef.current = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setAnimStage("typing");
            observerRef.current && observerRef.current.disconnect();
          }
        });
      },
      { threshold: 1 }
    );
    observerRef.current.observe(node);
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [animStage]);

  // Animation sequence
  useEffect(() => {
    if (animStage === "typing") {
      const timer = setTimeout(
        () => setAnimStage("progress"),
        animationTiming.typing || 8000
      );
      return () => clearTimeout(timer);
    }
    if (animStage === "progress") {
      const timer = setTimeout(
        () => setAnimStage("check"),
        animationTiming.progress || 1200
      );
      return () => clearTimeout(timer);
    }
    if (animStage === "check") {
      const timer = setTimeout(() => {
        setAnimStage("done");
        setShowItinerary(true);
      }, animationTiming.check || 800);
      return () => clearTimeout(timer);
    }
  }, [animStage, animationTiming]);

  return (
    <div
      ref={containerRef}
      className="flex justify-center items-center h-full relative"
    >
      <img
        src={imageSrc}
        alt={imageAlt}
        style={{
          width: "90%",
          maxWidth: "320px",
          transform:
            "perspective(700px) rotateY(-16deg) rotateX(8deg) scale(0.98)",
          objectFit: "cover",
          display: "block",
          filter: showItinerary ? "none" : "blur(2px)",
          opacity: showItinerary ? 1 : 0,
          transition: "filter 0.5s, opacity 0.7s cubic-bezier(0.4,0,0.2,1)",
          ...imageStyle,
        }}
        className="shadow-sm shadow-neutral-200"
      />
      {/* Chat head / Animation overlay */}
      <AnimatePresence mode="wait">
        {animStage !== "done" && animStage !== "idle" && (
          <motion.div
            key="chathead"
            initial={{ opacity: 0, scale: 1.1, height: 0, width: 0 }}
            animate={{
              opacity: 1,
              scale: 1,
              height: "auto",
              width: "auto",
              transition: {
                opacity: { duration: 0.5 },
                scale: { duration: 0.5 },
                height: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
                width: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
              },
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              height: 0,
              width: 0,
              transition: {
                opacity: { duration: 0.4 },
                scale: { duration: 0.4 },
                height: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
                width: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
              },
            }}
            style={{
              position: "absolute",
              zIndex: 2,
              minWidth: "210px",
              background: "white",
              boxShadow: "0 2px 12px 0 rgba(0,0,0,0.04)",
              borderRadius: "1.5rem",
              padding: "1.1rem 1.3rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.7rem",
              overflow: "hidden",
              ...chatHeadStyle,
            }}
            layout
          >
            <AnimatePresence mode="wait">
              {animStage === "typing" && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex flex-col gap-2 max-[600px]:text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 min-w-[56px]">
                        What
                      </span>
                      <span className="text-sm font-[400] text-gray-800">
                        <TextType
                          text={["explore"]}
                          typingSpeed={75}
                          pauseDuration={1500}
                          showCursor={false}
                          textColors={["black"]}
                          hideCursorWhileTyping
                          loop={false}
                          initialDelay={1500}
                          startOnVisible
                        />
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 min-w-[56px]">
                        Where
                      </span>
                      <span className="text-sm font-[400] text-gray-800">
                        <TextType
                          text={["Paris, France"]}
                          typingSpeed={75}
                          pauseDuration={1500}
                          showCursor={false}
                          textColors={["black"]}
                          hideCursorWhileTyping
                          loop={false}
                          initialDelay={2500}
                          startOnVisible
                        />
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 min-w-[56px]">
                        When
                      </span>
                      <span className="text-sm font-[400] text-gray-800">
                        <TextType
                          text={["May 12 - May 18"]}
                          typingSpeed={75}
                          pauseDuration={1500}
                          showCursor={false}
                          textColors={["black"]}
                          hideCursorWhileTyping
                          loop={false}
                          initialDelay={3000}
                          startOnVisible
                        />
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-gray-800 min-w-[56px] mt-1">
                        Prefer
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag, i) => (
                          <motion.span
                            key={tag.label}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${tag.className}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.7,
                              delay: 4 + i * 0.2,
                              ease: "anticipate",
                            }}
                          >
                            {tag.label}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {animStage === "progress" && (
                <motion.div
                  key="progress"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-center items-center min-h-[80px]"
                >
                  <CircularProgress disableShrink />
                </motion.div>
              )}
              {animStage === "check" && (
                <motion.div
                  key="check"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-center items-center min-h-[80px]"
                >
                  <Check color="#22c55e" size={48} strokeWidth={3} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ItineraryShowcase;
