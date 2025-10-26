import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { z } from "zod";
import { authGate } from "@/authentication/authGate";
import { GetServerSidePropsContext } from "next";
import { useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { handleAxiosError } from "@/functions/handleAxiosError";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

type Mode =
  | "login"
  | "register"
  | "forgot-password"
  | "reset-sent"
  | "verification-sent";

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const udc = await authGate(ctx);
  return udc;
};

export default function Login({ api }: any) {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const loginSchema = z.object({
    email: z.string().trim().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
  });

  const registerSchema = z
    .object({
      name: z.string().trim().min(1, "Name is required"),
      email: z.string().trim().email("Please enter a valid email address"),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters long"),
      confirmPassword: z
        .string()
        .min(8, "Password must be at least 8 characters long"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

  const loginFunction = async (email: string, password: string) => {
    try {
      if (!executeRecaptcha) {
        setError("reCAPTCHA unavailable.");
        return;
      }

      const rcpToken = await executeRecaptcha("login");
      const res = await queryClient.fetchQuery({
        queryKey: ["login"],
        queryFn: async () => {
          const res = await axios.post(
            `${api}/login`,
            {
              email: email,
              password: password,
              rcpToken,
            },
            {
              withCredentials: true,
            }
          );
          return res.data.token;
        },
      });
      router.push("/");
      return res;
    } catch (e: unknown) {
      setLoading(false);
      const wtaError = handleAxiosError(e as AxiosError);
      if (wtaError === "INVALID_CREDENTIALS") {
        setError("Invalid credentials");
      } else if (wtaError === "USER_NOT_FOUND") {
        setError("User not found");
      } else if (wtaError === "RECAPTCHA_FAIL") {
        setError(
          "Browser verification failed. Please refresh the page and try again."
        );
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const registerFunction = async (
    name: string,
    email: string,
    password: string
  ) => {
    try {
      if (!executeRecaptcha) {
        setError("reCAPTCHA unavailable.");
        return;
      }

      const rcpToken = await executeRecaptcha("register");

      const res = await queryClient.fetchQuery({
        queryKey: ["register"],
        queryFn: async () => {
          const res = await axios.post(
            `${api}/register`,
            {
              name: name,
              email: email,
              password: password,
              rcpToken,
            },
            {
              withCredentials: true,
            }
          );
          return res.data;
        },
      });
      setMode("verification-sent");
      setLoading(false);
      return res;
    } catch (e: unknown) {
      setLoading(false);
      const wtaError = handleAxiosError(e as AxiosError);
      if (wtaError === "USER_ALREADY_EXISTS") {
        setError("User already exists");
      } else if (wtaError === "RECAPTCHA_FAIL") {
        setError(
          "Browser verification failed. Please refresh the page and try again."
        );
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    // Access current input values
    const currentValues = {
      name,
      email,
      password,
      confirmPassword,
    };

    const result =
      mode === "login"
        ? loginSchema.safeParse({
            email: currentValues.email,
            password: currentValues.password,
          })
        : registerSchema.safeParse(currentValues);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      setError(firstIssue?.message ?? "Invalid input");
      setLoading(false);
      return;
    }

    const payload =
      mode === "login"
        ? { mode, email: currentValues.email, password: currentValues.password }
        : {
            mode,
            name: currentValues.name,
            email: currentValues.email,
            password: currentValues.password,
            confirmPassword: currentValues.confirmPassword,
          };

    // Provide JSON payload to caller (consumer can hook into this via console or future handler)
    // eslint-disable-next-line no-console
    if (mode === "login") {
      loginFunction(payload.email, payload.password);
    } else {
      registerFunction(payload.name!, payload.email, payload.password);
    }
  };

  const handleGoogleLogin = () => {
    const oauth2Endpoint = "https://accounts.google.com/o/oauth2/v2/auth";
    const params = {
      client_id:
        "870221194790-573ia3vf100f1vm2mpp633605nmop5f2.apps.googleusercontent.com",
      redirect_uri: `${window.location.origin}/finish_google_sso`,
      response_type: "code",
      scope: "openid email profile",
      include_granted_scopes: "true",
      state: "pass-through value",
      prompt: "consent", // consent | none
    };
    const queryString = new URLSearchParams(params).toString();
    const authUrl = `${oauth2Endpoint}?${queryString}`;
    window.location.href = authUrl;
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Please enter your email address first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!executeRecaptcha) {
        setError("reCAPTCHA unavailable.");
        return;
      }

      const rcpToken = await executeRecaptcha("register");

      await queryClient.fetchQuery({
        queryKey: ["forgot-password"],
        queryFn: async () => {
          await axios.post(`${api}/forgot-password`, {
            email: email,
            rcpToken,
          });
          return "";
        },
      });

      setError(null);
      setMode("reset-sent");
    } catch (e: unknown) {
      const wtaError = handleAxiosError(e as AxiosError);
      if (wtaError === "USER_NOT_FOUND") {
        setError("No account found with this email address");
      } else if (wtaError === "RECAPTCHA_FAIL") {
        setError(
          "Browser verification failed. Please refresh the page and try again."
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Where Should I Vacation</title>
        <meta
          name="description"
          content="Sign in to your Where Should I Vacation account"
        />
      </Head>
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        </div>

        <div className="relative w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl shadow-black/10 p-8">
            {/* Logo */}
            <motion.div
              className="flex items-center justify-center mb-8 cursor-pointer"
              onClick={() => router.push("/")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Image src="/wta.svg" alt="Logo" width={160} height={50} />
            </motion.div>

            <AnimatePresence mode="wait">
              {/* Login/Register Mode */}
              {(mode === "login" || mode === "register") && (
                <motion.div
                  key="auth-mode"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Welcome text */}
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {mode === "login" ? "Welcome back" : "Create account"}
                    </h1>
                    <p className="text-gray-600">
                      {mode === "login"
                        ? "Sign in to your account to continue"
                        : "Join us to start planning your perfect vacation"}
                    </p>
                  </div>

                  {/* Mode selector */}
                  <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                    <motion.button
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        mode === "login"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      onClick={() => setMode("login")}
                      disabled={loading}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                    >
                      Sign In
                    </motion.button>
                    <motion.button
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        mode === "register"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      onClick={() => setMode("register")}
                      disabled={loading}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                    >
                      Sign Up
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Forgot Password Mode */}
              {mode === "forgot-password" && (
                <motion.div
                  key="forgot-password-mode"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      Reset your password
                    </h1>
                    <p className="text-gray-600">
                      Enter your email address and we'll send you a link to
                      reset your password
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Reset Sent Mode */}
              {mode === "reset-sent" && (
                <motion.div
                  key="reset-sent-mode"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      Check your email
                    </h1>
                    <p className="text-gray-600">
                      A reset link has been sent to{" "}
                      <span className="font-medium text-gray-900">{email}</span>
                      . If this email exists in our system, you will receive
                      password reset instructions shortly.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Verification Sent Mode */}
              {mode === "verification-sent" && (
                <motion.div
                  key="verification-sent-mode"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      Verify your email
                    </h1>
                    <p className="text-gray-600">
                      A verification email has been sent to{" "}
                      <span className="font-medium text-gray-900">{email}</span>
                      . Please check your inbox and click the verification link
                      to complete your registration.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forms */}
            <AnimatePresence mode="wait">
              {/* Login/Register Form */}
              {(mode === "login" || mode === "register") && (
                <motion.form
                  key="auth-form"
                  onSubmit={handleSubmit}
                  className="space-y-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AnimatePresence mode="wait">
                    {mode === "register" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            formNoValidate
                            type="text"
                            value={name}
                            onChange={(e) => {
                              setError(null);
                              setName(e.target.value);
                            }}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all duration-200 placeholder-gray-400"
                            placeholder="Enter your full name"
                            disabled={loading}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        formNoValidate
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setError(null);
                          setEmail(e.target.value);
                        }}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all duration-200 placeholder-gray-400"
                        placeholder="Enter your email"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        formNoValidate
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setError(null);
                          setPassword(e.target.value);
                        }}
                        className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all duration-200 placeholder-gray-400"
                        placeholder="Enter your password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        )}
                      </button>
                    </div>
                    {mode === "login" && (
                      <div className="text-right mt-2">
                        <button
                          type="button"
                          onClick={() => setMode("forgot-password")}
                          className="text-orange-600 hover:text-orange-700 transition-colors"
                          disabled={loading}
                        >
                          <span className="text-sm font-semibold">
                            Forgot password?
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    {mode === "register" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            formNoValidate
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => {
                              setError(null);
                              setConfirmPassword(e.target.value);
                            }}
                            className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all duration-200 placeholder-gray-400"
                            placeholder="Confirm your password"
                            disabled={loading}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-4 bg-red-50 border border-red-200 rounded-xl"
                      >
                        <p className="text-sm text-red-700 font-medium">
                          {error}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>
                          {mode === "login"
                            ? "Signing in..."
                            : "Creating account..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>
                          {mode === "login" ? "Sign in" : "Create account"}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </motion.form>
              )}

              {/* Forgot Password Form */}
              {mode === "forgot-password" && (
                <motion.form
                  key="forgot-password-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleForgotPassword();
                  }}
                  className="space-y-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setError(null);
                          setEmail(e.target.value);
                        }}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all duration-200 placeholder-gray-400"
                        placeholder="Enter your email"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-4 bg-red-50 border border-red-200 rounded-xl"
                      >
                        <p className="text-sm text-red-700 font-medium">
                          {error}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending reset link...</span>
                      </>
                    ) : (
                      <>
                        <span>Send reset link</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      disabled={loading}
                    >
                      ← Back to sign in
                    </button>
                  </div>
                </motion.form>
              )}

              {/* Reset Sent Actions */}
              {mode === "reset-sent" && (
                <motion.div
                  key="reset-sent-actions"
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.button
                    onClick={() => setMode("login")}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg shadow-orange-500/25 transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Back to sign in</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}

              {/* Verification Sent Actions */}
              {mode === "verification-sent" && (
                <motion.div
                  key="verification-sent-actions"
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.button
                    onClick={() => setMode("login")}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg shadow-orange-500/25 transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Back to sign in</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google SSO - Only show for login/register modes */}
            {(mode === "login" || mode === "register") && (
              <div className="mt-6">
                <div className="relative text-center my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative inline-block bg-white px-4 text-sm text-gray-500">
                    Or continue with
                  </div>
                </div>

                <motion.button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 py-3 px-6 rounded-xl font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className="h-5 w-5"
      aria-hidden
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.602 31.91 29.197 35 24 35c-7.18 0-13-5.82-13-13s5.82-13 13-13c3.162 0 6.056 1.154 8.293 3.046l5.657-5.657C34.676 3.053 29.566 1 24 1 11.85 1 2 10.85 2 23s9.85 22 22 22 22-9.85 22-22c0-1.474-.152-2.913-.389-4.333z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.817C14.36 16.143 18.82 13 24 13c3.162 0 6.056 1.154 8.293 3.046l5.657-5.657C34.676 3.053 29.566 1 24 1 16.318 1 9.656 5.337 6.306 11.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 45c5.137 0 9.795-1.977 13.293-5.197l-6.146-5.2C29.004 36.488 26.65 37.5 24 37.5c-5.165 0-9.557-3.071-11.29-7.49l-6.54 5.033C9.472 40.556 16.211 45 24 45z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-1.025 3.027-3.234 5.578-6.156 7.02l.005-.003 6.146 5.2C37.14 41.449 44 37 44 23c0-1.474-.152-2.913-.389-4.333z"
      />
    </svg>
  );
}
