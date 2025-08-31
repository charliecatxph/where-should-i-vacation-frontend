import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { z } from "zod";
import { GetServerSidePropsContext } from "next";
import { useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { handleAxiosError } from "@/functions/handleAxiosError";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, ArrowRight, CheckCircle } from "lucide-react";

type Mode = "reset" | "success";
type CFPWMode = "sign" | "change";

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
 const { uuid } = ctx.query;

 if (!uuid || typeof uuid !== 'string') {
  return {
   redirect: {
    destination: '/login',
    permanent: false,
   },
  };
 }

 try {
  const res = await axios.post(`${process.env.SERVER}/change-password`, {
   mode: "sign" as CFPWMode,
   uuid: uuid,
  })

  return {
   props: {
    token: res.data.token,
    api: process.env.ABS_SERVER,
   },
  };
 } catch (error) {
  return {
   redirect: {
    destination: '/login',
    permanent: false,
   },
  };
 }
};

export default function ResetPassword({ api, token }: { token: string; api: string }) {
 const queryClient = useQueryClient();
 const [mode, setMode] = useState<Mode>("reset");
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] = useState(false);
 const router = useRouter();

 const resetPasswordSchema = z
  .object({
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

 const handleResetPassword = async (password: string) => {
  try {
   const res = await queryClient.fetchQuery({
    queryKey: ["reset-password"],
    queryFn: async () => {
     const res = await axios.post(
      `${api}/api/change-password`,
      {
       token: token,
       pw: password,
       mode: "change" as CFPWMode
      },
     );
     return res.data;
    },
   });

   setMode("success");
   return res;
  } catch (e: unknown) {
   setLoading(false);
   const wtaError = handleAxiosError(e as AxiosError);
   if (wtaError === "USER_NOT_FOUND") {
    setError("This reset link has expired or is invalid");
   } else if (wtaError === "PARAMETERS_INCOMPLETE") {
    setError("Password is too weak. Please choose a stronger password");
   } else {
    setError("An unexpected error occurred. Please try again");
   }
  }
 };

 const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  setLoading(true);
  setError(null);

  const currentValues = {
   password,
   confirmPassword,
  };

  const result = resetPasswordSchema.safeParse(currentValues);

  if (!result.success) {
   const firstIssue = result.error.issues[0];
   setError(firstIssue?.message ?? "Invalid input");
   setLoading(false);
   return;
  }

  await handleResetPassword(currentValues.password);
 };

 return (
  <>
   <Head>
    <title>Reset Password - Where Should i Vacation</title>
    <meta name="description" content="Reset your Where Should I Vacation account password" />
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
       {/* Reset Password Mode */}
       {mode === "reset" && (
        <motion.div
         key="reset-mode"
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, y: -20 }}
         transition={{ duration: 0.3 }}
        >
         <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
           Create new password
          </h1>
          <p className="text-gray-600">
           Enter a new password for your account
          </p>
         </div>
        </motion.div>
       )}

       {/* Success Mode */}
       {mode === "success" && (
        <motion.div
         key="success-mode"
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, y: -20 }}
         transition={{ duration: 0.3 }}
        >
         <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
           <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
           Password updated!
          </h1>
          <p className="text-gray-600">
           Your password has been successfully updated. You can now sign in with your new password.
          </p>
         </div>
        </motion.div>
       )}
      </AnimatePresence>

      {/* Forms */}
      <AnimatePresence mode="wait">
       {/* Reset Password Form */}
       {mode === "reset" && (
        <motion.form
         key="reset-form"
         onSubmit={handleSubmit}
         className="space-y-5"
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, y: -20 }}
         transition={{ duration: 0.3 }}
        >
         <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
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
            placeholder="Enter your new password"
            disabled={loading}
            required
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
         </div>

         <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
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
            placeholder="Confirm your new password"
            disabled={loading}
            required
           />
           <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
           >
            {showConfirmPassword ? (
             <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
            ) : (
             <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
            )}
           </button>
          </div>
         </div>

         <AnimatePresence>
          {error && (
           <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 border border-red-200 rounded-xl"
           >
            <p className="text-sm text-red-700 font-medium">{error}</p>
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
            <span>Updating password...</span>
           </>
          ) : (
           <>
            <span>Update password</span>
            <ArrowRight className="w-4 h-4" />
           </>
          )}
         </motion.button>

         <div className="text-center">
          <button
           type="button"
           onClick={() => router.push("/login")}
           className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
           disabled={loading}
          >
           ← Back to sign in
          </button>
         </div>
        </motion.form>
       )}

       {/* Success Actions */}
       {mode === "success" && (
        <motion.div
         key="success-actions"
         className="space-y-4"
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, y: -20 }}
         transition={{ duration: 0.3 }}
        >
         <motion.button
          onClick={() => router.push("/login")}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg shadow-orange-500/25 transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
         >
          <span>Sign in now</span>
          <ArrowRight className="w-4 h-4" />
         </motion.button>
        </motion.div>
       )}
      </AnimatePresence>
     </div>
    </div>
   </main>
  </>
 );
}