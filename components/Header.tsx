import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  CircleQuestionMark,
  Coins,
  DoorOpen,
  MapPin,
  Menu,
  Paperclip,
  Settings,
  X,
} from "lucide-react";
import { useClickOutside } from "@/hooks/UseClickOutside";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { lightBlue } from "@mui/material/colors";

interface NavButton {
  name: string;
  route: string;
}

interface HeaderProps {
  userData__final: any;
  navButtons: NavButton[];
  api: string;
}

export const Header: React.FC<HeaderProps> = ({
  userData__final,
  navButtons,
  api,
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useClickOutside<HTMLDivElement>(() =>
    setShowDropdown(false)
  );
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await queryClient.fetchQuery({
        queryKey: ["logout"],
        queryFn: async () => {
          const res = await axios.post(`${api}/logout`, null, {
            withCredentials: true,
          });
          return res.data;
        },
        staleTime: 0,
        gcTime: 0,
      });
    } catch (error) {
      // Silently ignore logout errors for now
    } finally {
      setShowDropdown(false);
      window.location.href = "/";
    }
  };

  return (
    <header className="sticky top-0 z-[999]">
      <div className="bg-orange-600 w-full strip px-5">
        <div className="ctx-container">
          <div className="wrapper flex justify-end py-[5px] relative ">
            {userData__final ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  className="flex items-center gap-2 text-white font-[500] px-4 py-0.5 rounded hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300 max-[700px]:hidden"
                  onClick={() => setShowDropdown((v) => !v)}
                >
                  <span className="text-sm">
                    Logged in as {userData__final.name}
                  </span>
                  <ChevronDown size={18} />
                </button>
                <AnimatePresence>
                  {showDropdown && (
                    <motion.ul
                      initial={{
                        opacity: 0,
                        scale: 0.8,
                        originX: 1,
                        originY: 0,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        originX: 1,
                        originY: 0,
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.8,
                        originX: 1,
                        originY: 0,
                      }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute top-full w-[250px] right-0 mt-2  bg-white shadow-xl rounded-xl py-2 z-50 border border-neutral-200 overflow-hidden max-[700px]:hidden"
                    >
                      <li>
                        <div className="px-4 py-1 text-xs font-semibold text-neutral-400 select-none">
                          Account
                        </div>
                      </li>
                      <li className="px-4 py-1 flex items-center">
                        <Coins size={18} className="text-orange-500" />{" "}
                        <span className="text-sm ml-2">
                          {userData__final.generation_credits} generation credit
                          {userData__final.generation_credits > 1 && "s"}
                        </span>
                      </li>
                      <li className="px-4 py-1 flex items-center">
                        <Paperclip size={18} className="text-blue-500" />{" "}
                        <span className="text-sm ml-2">
                          {userData__final.itinerary_credits} itinerary credit
                          {userData__final.itinerary_credits > 1 && "s"}
                        </span>
                      </li>
                      <li>
                        <div className="px-4 py-1 text-xs font-semibold text-neutral-400 select-none">
                          Generations
                        </div>
                      </li>
                      <li>
                        <Link
                          href="/history"
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm font-normal text-black hover:bg-neutral-50 transition-colors"
                        >
                          <CircleQuestionMark
                            size={18}
                            className="text-orange-500"
                          />
                          Generation History
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/itinerary-history"
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm font-normal text-black hover:bg-neutral-50 transition-colors"
                        >
                          <MapPin size={18} className="text-blue-500" />
                          Itinerary History
                        </Link>
                      </li>
                      <li>
                        <div className="my-1 border-t border-neutral-200" />
                      </li>
                      <li>
                        <div className="px-4 py-1 text-xs font-semibold text-neutral-400 select-none">
                          Management
                        </div>
                      </li>

                      <li>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm font-normal text-black hover:bg-neutral-50 transition-colors"
                        >
                          <DoorOpen size={18} className="text-red-500" />
                          <div className="text-sm">Logout</div>
                        </button>
                      </li>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="authentication flex gap-2 text-white font-[500] text-sm max-[700px]:hidden">
                <button onClick={() => router.push("/login")} className="px-2">
                  Sign In
                </button>
                <button onClick={() => router.push("/login")} className="pl-2">
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="w-full main-header shadow-sm shadow-neutral-50 border-b-1 py-3 border-neutral-50 bg-white  px-5">
        <div className="ctx-container">
          <div className="wrapper flex justify-between py-[5px]">
            <div className="logo">
              <Link href="/">
                <img src="wta.svg" alt="" className="w-[140px]" />
              </Link>
            </div>
            <ul className="action-buttons flex gap-2 items-center font-[500] text-sm max-[700px]:hidden">
              {navButtons.map((btn) => (
                <li key={btn.route}>
                  <Link href={btn.route}>
                    <button className="select-none px-3 text-sm font-[600] hover:text-orange-600 transition-colors">
                      {btn.name}
                    </button>
                  </Link>
                </li>
              ))}
            </ul>
            <button
              className="hidden max-[700px]:block"
              aria-label={showMobileMenu ? "Close menu" : "Open menu"}
              aria-expanded={showMobileMenu}
              onClick={() => setShowMobileMenu((v) => !v)}
            >
              {showMobileMenu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="fixed inset-0 bg-black/20 backdrop-blur-[1px] md:hidden z-[900]"
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -8, scaleY: 0.95, originY: 0 }}
              animate={{ opacity: 1, y: 0, scaleY: 1, originY: 0 }}
              exit={{ opacity: 0, y: -8, scaleY: 0.95, originY: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute top-full w-full px-5 md:hidden z-[1000]"
            >
              <div
                className="bg-white rounded-xl py-5 border border-neutral-200 shadow-lg ring-1 ring-black/5 max-h-[80vh] overflow-y-auto overscroll-contain"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <ul className="flex gap-2 flex-col">
                  {navButtons.map((btn) => (
                    <li
                      key={btn.route}
                      className="hover:bg-neutral-50 rounded-md"
                    >
                      <Link href={btn.route}>
                        <button
                          className="px-8 py-3 w-full text-left select-none text-sm font-[600] hover:text-orange-600 transition-colors"
                          onClick={() => setShowMobileMenu(false)}
                        >
                          <span className="font-semibold text-black">
                            {btn.name}
                          </span>
                        </button>
                      </Link>
                    </li>
                  ))}
                </ul>
                <ul className="flex gap-2 flex-col border-t border-neutral-100 py-2">
                  {userData__final ? (
                    <>
                      <li>
                        <div className="px-8 py-1 text-xs font-semibold text-neutral-400 select-none">
                          Credits
                        </div>
                      </li>
                      <li>
                        <button className="px-8 py-3  flex items-center w-full text-left">
                          <Coins size={18} className="text-orange-500" />{" "}
                          <span className="ml-2 font-[500]">
                            {userData__final.generation_credits} generation
                            credit
                            {userData__final.generation_credits > 1 && "s"}
                          </span>
                        </button>
                      </li>
                      <li>
                        <button className="px-8 py-3  flex items-center w-full text-left">
                          <Paperclip size={18} className="text-blue-500" />{" "}
                          <span className="ml-2 font-[500]">
                            {userData__final.itinerary_credits} itinerary credit
                            {userData__final.itinerary_credits > 1 && "s"}
                          </span>
                        </button>
                      </li>

                      <li>
                        <div className="px-8 py-1 text-xs font-semibold text-neutral-400 select-none">
                          Generations
                        </div>
                      </li>
                      <li>
                        <Link
                          href="/history"
                          className="flex items-center gap-2 w-full px-8 py-2 font-[500] text-black hover:bg-neutral-50 transition-colors"
                          onClick={() => setShowMobileMenu(false)}
                        >
                          <CircleQuestionMark
                            size={18}
                            className="text-orange-500"
                          />
                          Generation History
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/itinerary-history"
                          className="flex items-center gap-2 w-full px-8 py-2 font-[500] text-black hover:bg-neutral-50 transition-colors"
                          onClick={() => setShowMobileMenu(false)}
                        >
                          <MapPin size={18} className="text-blue-500" />
                          Itinerary History
                        </Link>
                      </li>
                      <li>
                        <div className="my-1 border-t border-neutral-200" />
                      </li>
                      <li>
                        <div className="px-8 py-1 text-xs font-semibold text-neutral-400 select-none">
                          Management
                        </div>
                      </li>

                      <li>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-8 py-2 text-black hover:bg-neutral-50 transition-colors"
                        >
                          <DoorOpen size={18} className="text-red-500" />
                          <div className="font-[500]">Logout</div>
                        </button>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="hover:bg-neutral-50 rounded-md">
                        <Link href="/login">
                          <button
                            className="px-8 py-3 w-full text-left select-none text-sm font-[600] hover:text-orange-600 transition-colors"
                            onClick={() => setShowMobileMenu(false)}
                          >
                            <span className="font-semibold text-black">
                              Login
                            </span>
                          </button>
                        </Link>
                      </li>
                      <li className="hover:bg-neutral-50 rounded-md">
                        <Link href={"/login"}>
                          <button
                            className="px-8 py-3 w-full text-left select-none text-sm font-[600] hover:text-orange-600 transition-colors"
                            onClick={() => setShowMobileMenu(false)}
                          >
                            <span className="font-semibold text-black">
                              Register
                            </span>
                          </button>
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
