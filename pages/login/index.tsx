import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { z } from "zod";
import { authGate } from "@/authentication/authGate";
import { GetServerSidePropsContext } from "next";
import { useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { handleAxiosError } from "@/functions/handleAxiosError";

type Mode = "login" | "register";

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const udc = await authGate(ctx);
  return udc;
};

export default function Login({ api }: any) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      const res = await queryClient.fetchQuery({
        queryKey: ["login"],
        queryFn: async () => {
          const res = await axios.post(
            `${api}/login`,
            {
              email: email,
              password: password,
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
      const res = await queryClient.fetchQuery({
        queryKey: ["register"],
        queryFn: async () => {
          const res = await axios.post(
            `${api}/register`,
            {
              name: name,
              email: email,
              password: password,
            },
            {
              withCredentials: true,
            }
          );
          return res.data;
        },
      });
      router.push("/");
      return res;
    } catch (e: unknown) {
      setLoading(false);
      const wtaError = handleAxiosError(e as AxiosError);
      if (wtaError === "USER_ALREADY_EXISTS") {
        setError("User already exists");
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

  const googleSso = () => {
    const oauth2Endpoint = "https://accounts.google.com/o/oauth2/v2/auth";
    const params = {
      client_id:
        "809764268147-1vjldass3m9fmef2l7sm2qfv1o7dkt2k.apps.googleusercontent.com",
      redirect_uri: "http://localhost:3000/finish_google_sso",
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

  return (
    <main className="min-h-screen grid place-items-center bg-white text-black p-5">
      <div className="w-full max-w-md px-4 ">
        <div className="p-6 border border-zinc-200 rounded-xl transition-colors flex flex-col gap-5 shadow-xs">
          <div
            className="h-10 flex items-center justify-center cursor-pointer"
            onClick={() => router.push("/")}
          >
            <Image src="/wta.svg" alt="Logo" width={140} height={44} />
          </div>

          <div className="w-full">
            <div className="flex w-full gap-2">
              <button
                className={`flex-1 px-4 py-1 text-sm rounded-lg transition-colors border text-center ${
                  mode === "login"
                    ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                    : "bg-white text-neutral-700 border-0 hover:bg-neutral-100"
                }`}
                onClick={() => setMode("login")}
                disabled={loading}
                type="button"
              >
                <span className="text-sm font-semibold">Login</span>
              </button>
              <button
                className={`flex-1 px-4 py-1 text-sm rounded-lg transition-colors border text-center ${
                  mode === "register"
                    ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                    : "bg-white text-neutral-700 border-0 hover:bg-neutral-100"
                }`}
                onClick={() => setMode("register")}
                disabled={loading}
                type="button"
              >
                <span className="text-sm font-semibold">Register</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && (
              <div>
                <label className="block text-xs mb-1">Name</label>
                <input
                  formNoValidate
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setError(null);
                    setName(e.target.value);
                  }}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                  placeholder="Your name"
                  disabled={loading}
                />
              </div>
            )}

            <div>
              <label className="block text-xs mb-1">Email</label>
              <input
                formNoValidate
                type="email"
                value={email}
                onChange={(e) => {
                  setError(null);
                  setEmail(e.target.value);
                }}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs mb-1">Password</label>
              <input
                formNoValidate
                type="password"
                value={password}
                onChange={(e) => {
                  setError(null);
                  setPassword(e.target.value);
                }}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-xs mb-1">Confirm password</label>
                <input
                  formNoValidate
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setError(null);
                    setConfirmPassword(e.target.value);
                  }}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            )}

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-orange-600 text-white py-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>
                    {mode === "login" ? "Signing in..." : "Creating account..."}
                  </span>
                </>
              ) : (
                <span className="font-semibold">
                  {mode === "login" ? "Sign in" : "Create account"}
                </span>
              )}
            </button>
          </form>

          <div className="mt-2">
            <div className="relative text-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative inline-block bg-white px-2 text-xs text-zinc-500">
                Or continue with
              </div>
            </div>

            <button
              onClick={() => googleSso()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white py-2 hover:bg-zinc-50 disabled:opacity-60"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>
          </div>
        </div>
      </div>
    </main>
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
