import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { GetServerSidePropsContext } from "next";
import axios, { AxiosError } from "axios";
import Head from "next/head";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
 const { acctId } = ctx.query;
 const absoluteServerUrl = `${process.env.ORIGIN}/api`;

 if (!acctId || typeof acctId !== 'string') {
  return {
   redirect: {
    destination: '/login',
    permanent: false,
   },
  };
 }

 try {
  const res = await axios.post(`${absoluteServerUrl}/verify-account`, {
   acctId: acctId,
  });

  return {
   props: {
    success: true,
    api: process.env.SERVER,
   },
  };
 } catch (error) {
  console.log(error)
  return {
   redirect: {
    destination: '/login',
    permanent: false,
   },
  };
 }
};

export default function VerifyAccount({ success, api }: { success: boolean; api: string }) {
 const [countdown, setCountdown] = useState(5);
 const router = useRouter();

 useEffect(() => {
  if (success) {
   const timer = setInterval(() => {
    setCountdown((prev) => {
     if (prev <= 1) {
      clearInterval(timer);
      router.push('/login');
      return 0;
     }
     return prev - 1;
    });
   }, 1000);

   return () => clearInterval(timer);
  }
 }, [success, router]);

 return (
  <>
   <Head>
    <title>Account Verified - Where Should I Vacation</title>
    <meta name="description" content="Your Where Should I Vacation account has been verified" />
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

      {/* Success Content */}
      <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.3 }}
      >
       <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
         <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
         Account Verified!
        </h1>
        <p className="text-gray-600 mb-6">
         Your email has been successfully verified. Your account is now active and ready to use.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
         <p className="text-sm text-green-700 font-medium">
          Welcome to Where Should I Vacation! You can now start planning your perfect getaway.
         </p>
        </div>
        <p className="text-sm text-gray-500">
         Redirecting to sign in page in{" "}
         <span className="font-semibold text-orange-600">{countdown}</span>{" "}
         seconds...
        </p>
       </div>
      </motion.div>

      {/* Manual redirect button */}
      <motion.button
       onClick={() => router.push('/login')}
       className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg shadow-orange-500/25 transition-all duration-200"
       whileHover={{ scale: 1.02 }}
       whileTap={{ scale: 0.98 }}
      >
       <span>Sign in now</span>
       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
       </svg>
      </motion.button>
     </div>
    </div>
   </main>
  </>
 );
}