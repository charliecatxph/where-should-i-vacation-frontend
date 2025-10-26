import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, MapPin, Sparkle } from "lucide-react";
import { Inter, Geist } from "next/font/google";
import { useRouter } from "next/router";
import Head from "next/head";
import axios from "axios";
import { GetServerSidePropsContext } from "next";

const inter = Inter({ subsets: ["latin"] });
const geist = Geist({ subsets: ["latin"] });

type Plan = "Traveler" | "Explorer" | "Journeyman";

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { acctId } = ctx.query;
  const absoluteServerUrl = `${process.env.ORIGIN}/api`;

  if (!acctId || typeof acctId !== "string") {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  try {
    const res = await axios.post(
      `${absoluteServerUrl}/verify-account`,
      {
        acctId: acctId,
      },
      { withCredentials: true }
    );

    const setCookie = res.headers["set-cookie"];

    ctx.res.setHeader("Set-Cookie", setCookie!);

    return {
      props: {
        success: true,
        api: process.env.SERVER,
        token: res.data.token,
      },
    };
  } catch (error) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
};

export default function Onboard({
  api,
  token,
}: {
  api: string;
  token: string;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const router = useRouter();

  const handlePlanSelection = (plan: Plan) => {
    if (plan !== "Traveler") {
      handlePurchase(plan);
      return;
    }

    setSelectedPlan(plan);
    setCurrentStep(3); // Move to loading step
    // Add your plan selection logic here
    console.log(`Selected plan: ${plan}`);

    // Simulate processing and redirect
    setTimeout(() => {
      router.push("/"); // Redirect to main app
    }, 5000);
  };

  const handleContinueFree = () => {
    handlePlanSelection("Traveler");
  };

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handlePurchase = async (plan: "Journeyman" | "Explorer") => {
    try {
      const res = await axios.post(
        `${api}/purchase-credits`,
        {
          plan: plan,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      window.location = res.data.url;
    } catch (e) {}
  };

  return (
    <>
      <Head>
        <title>Welcome to Where Should I Vacation</title>
        <meta
          name="description"
          content="Welcome to your personalized travel planning journey"
        />
      </Head>

      <div
        className={`min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 ${geist.className}`}
      >
        <div className="ctx-container mx-auto px-5 py-10">
          <div className="max-w-4xl mx-auto mt-15">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6 }}
                  className="text-center"
                >
                  <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.8,
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.2,
                        duration: 0.8,
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                      }}
                      className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-blue-500 rounded-full mb-6"
                    >
                      <MapPin className="w-10 h-10 text-white" />
                    </motion.div>

                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.4,
                        duration: 0.8,
                        type: "spring",
                        stiffness: 120,
                        damping: 20,
                      }}
                      className="text-4xl md:text-5xl font-normal text-gray-800 mb-4"
                    >
                      Welcome to <br />
                      <span className="font-bold bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">
                        Where Should I Vacation
                      </span>
                    </motion.h1>

                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.6,
                        duration: 0.8,
                        type: "spring",
                        stiffness: 120,
                        damping: 20,
                      }}
                      className="text-lg font-medium text-gray-600 max-w-2xl mx-auto mb-8"
                    >
                      We're excited to help you plan amazing adventures. Let's
                      get you set up with the perfect plan for your travel
                      style.
                    </motion.p>
                  </motion.div>

                  <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      delay: 0.8,
                      duration: 0.8,
                      type: "spring",
                      stiffness: 150,
                      damping: 20,
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={nextStep}
                    className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-blue-500 text-white px-10 py-4 rounded-full font-bold text-xl shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    Let's Get Started
                    <ArrowRight className="w-6 h-6" />
                  </motion.button>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="text-center mb-10">
                    <motion.h2
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="text-3xl md:text-4xl font-medium text-gray-800 mb-4"
                    >
                      Get Started with Credits
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.4 }}
                      className="text-gray-600 max-w-2xl mx-auto mb-2"
                    >
                      Start free or add credits for more itineraries and AI
                      generations. No subscriptions — just pay once and use when
                      you need.
                    </motion.p>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.4 }}
                      className="text-sm text-gray-500"
                    >
                      You can always add more credits later.
                    </motion.p>
                  </div>

                  {/* Pricing Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Traveler Plan */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8, duration: 0.4 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePlanSelection("Traveler")}
                      className="bg-white border border-neutral-200 shadow-sm hover:shadow-md px-8 py-6 rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="tag bg-neutral-50 w-max px-4 py-1 rounded-full font-semibold border border-neutral-200 text-xs mb-4">
                          <span>Traveler</span>
                        </div>
                        <h3 className="text-2xl font-semibold mb-2">Free</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Perfect for trying things out. No cost, no commitment.
                        </p>
                        <ul className="space-y-2 mb-6">
                          <li className="flex items-center gap-2 text-sm">
                            <Check
                              className="w-4 h-4 text-green-600"
                              strokeWidth={2}
                            />
                            <span>Personalized itinerary builder</span>
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Check
                              className="w-4 h-4 text-green-600"
                              strokeWidth={2}
                            />
                            <span>10 AI-Powered Generations/day</span>
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Check
                              className="w-4 h-4 text-green-600"
                              strokeWidth={2}
                            />
                            <span>1 Itinerary/month</span>
                          </li>
                        </ul>
                      </div>
                      <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-full font-semibold transition-colors duration-200">
                        Choose Traveler
                      </button>
                    </motion.div>

                    {/* Explorer Plan */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0, duration: 0.4 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePlanSelection("Explorer")}
                      className="bg-white border border-blue-200 shadow-sm hover:shadow-md px-8 py-6 rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="tag bg-blue-50 text-blue-600 w-max px-4 py-1 rounded-full font-semibold border border-blue-200 text-xs mb-4">
                          <span>Explorer</span>
                        </div>
                        <h3 className="text-2xl font-semibold mb-2">$5</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          More generations and itineraries for exploring
                          options.
                        </p>
                        <ul className="space-y-2 mb-6">
                          <li className="flex items-center gap-2 text-sm">
                            <Check
                              className="w-4 h-4 text-green-600"
                              strokeWidth={2}
                            />
                            <span>Personalized itinerary builder</span>
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Check
                              className="w-4 h-4 text-green-600"
                              strokeWidth={2}
                            />
                            <span>20 AI-Powered Generations</span>
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Check
                              className="w-4 h-4 text-green-600"
                              strokeWidth={2}
                            />
                            <span>5 Itineraries</span>
                          </li>
                        </ul>
                      </div>
                      <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-full font-semibold transition-colors duration-200">
                        Choose Explorer
                      </button>
                    </motion.div>

                    {/* Journeyman Plan */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2, duration: 0.4 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePlanSelection("Journeyman")}
                      className="bg-gradient-to-br from-orange-500 to-blue-500 text-white shadow-lg hover:shadow-xl px-8 py-6 rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="tag bg-orange-100 text-orange-600 w-max px-4 py-1 rounded-full font-semibold text-xs mb-4">
                          <span>Journeyman</span>
                        </div>
                        <h3 className="text-2xl font-semibold mb-2">$10</h3>
                        <p className="text-sm mb-4 font-medium">
                          Maximum credits for planning multiple trips and
                          exploring all possibilities.
                        </p>
                        <ul className="space-y-2 mb-6">
                          <li className="flex items-center gap-2 text-sm">
                            <Check
                              className="w-4 h-4 text-white"
                              strokeWidth={3}
                            />
                            <span>Personalized itinerary builder</span>
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Check
                              className="w-4 h-4 text-white"
                              strokeWidth={3}
                            />
                            <span>45 AI-Powered Generations</span>
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <Check
                              className="w-4 h-4 text-white"
                              strokeWidth={3}
                            />
                            <span>12 Itineraries</span>
                          </li>
                        </ul>
                      </div>
                      <button className="w-full bg-white text-gray-800 hover:bg-gray-100 py-2 rounded-full font-semibold transition-colors duration-200">
                        Choose Journeyman
                      </button>
                    </motion.div>
                  </div>

                  {/* Continue Free Option */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4, duration: 0.4 }}
                    className="text-center"
                  >
                    <button
                      onClick={handleContinueFree}
                      className="text-gray-500 hover:text-gray-700 underline text-sm transition-colors duration-200"
                    >
                      Or start free with the Traveler
                    </button>
                  </motion.div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{
                      duration: 0.6,
                      type: "spring",
                      stiffness: 150,
                      damping: 20,
                    }}
                    className="mb-8"
                  >
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-blue-500 rounded-full mb-6">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-10 h-10 border-4 border-white border-t-transparent rounded-full"
                      />
                    </div>

                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="text-3xl md:text-4xl font-medium text-gray-800 mb-4"
                    >
                      Setting Up Your Account
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      className="text-lg font-medium text-gray-600 max-w-xl mx-auto"
                    >
                      We're preparing your experience. You'll be ready to start
                      planning amazing adventures in just a moment!
                    </motion.p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
