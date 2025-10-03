import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CreditCard,
  Server,
  RefreshCw,
  Mail,
  Settings,
  ArrowRight,
} from "lucide-react";
import { Inter } from "next/font/google";
import { useModal } from "./ModalContext";
import { useRouter } from "next/router";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

const inter = Inter({ subsets: ["latin"] });

const Modal = () => {
  const { openModal, closeModal } = useModal();
  const router = useRouter();

  return (
    <AnimatePresence>
      {openModal && (
        <motion.div
          className={`${inter.className} fixed inset-0 z-[9999] flex items-center justify-center bg-neutral-900/50`}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
        >
          <motion.div
            className="rounded-lg shadow-lg relative min-w-[300px] max-w-full"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={modalVariants}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {openModal === "parameterError" && (
              <ErrorIncomplete onClose={closeModal} router={router} />
            )}
            {openModal === "creditError" && (
              <ErrorCredits onClose={closeModal} router={router} />
            )}
             {openModal === "creditErrorNtl" && (
              <ErrorCreditsNtl onClose={closeModal} router={router} />
            )}
            {openModal === "serverError" && (
              <ErrorOffline onClose={closeModal} router={router} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;

// Error modals (vanilla, no Mantine)
const ErrorIncomplete = ({ onClose, router }: any) => (
  <div className="w-full max-w-md mx-auto bg-white border border-gray-200 rounded-lg shadow-md">
    <div className="text-center p-6 pb-4">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
        <AlertTriangle className="h-8 w-8 text-orange-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900">
        Parameters Incomplete
      </h2>
      <p className="text-base text-gray-600 mt-2">
        Some required information is missing to complete your request.
      </p>
    </div>
    <div className="px-6 pb-6 space-y-4">
      <div className="rounded-lg bg-orange-50 p-4 border border-orange-200">
        <p className="text-sm text-orange-800">
          Please check that all required fields are filled out correctly and try
          again.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => {
            onClose();
            router.push("/");
          }}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white  py-2 px-4 rounded inline-flex items-center justify-center"
        >
          <ArrowRight className="mr-2 h-4 w-4" strokeWidth={3} />
          <span className="font-semibold">Go to Generation Page</span>
        </button>
      </div>
    </div>
  </div>
);

const ErrorCreditsNtl = ({ onClose, router }: any) => (
  <div className="w-full max-w-md mx-auto bg-white border border-gray-200 rounded-lg shadow-md">
    <div className="text-center p-6 pb-4">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <CreditCard className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900">Out of Credits</h2>
      <p className="text-base text-gray-600 mt-2">
        You've used all your free credits and your network has been limited. Sign in to get the full experience.
      </p>
    </div>
    <div className="px-6 pb-6 space-y-4">
      <div className="rounded-lg bg-red-50 p-4 border border-red-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm  text-red-800">Current Balance</span>
          <span className="text-xs px-2 py-1 rounded bg-red-600 text-white">
            0 Credits
          </span>
        </div>
        <p className="text-sm text-red-700">
          Free Mode
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => {
            onClose();
            router.push("/login");
          }}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded inline-flex items-center justify-center"
        >
          <ArrowRight className="mr-2 h-4 w-4" strokeWidth={2} />
          <span className="font-semibold">Sign In</span>
        </button>
        <button
          onClick={() => {
            onClose();
            router.push("/");
          }}
          className="w-full border border-gray-300 hover:bg-gray-100 text-gray-800  py-2 px-4 rounded"
        >
          <span className="font-semibold">Go to Homepage</span>
        </button>
      </div>
    </div>
  </div>
);

const ErrorCredits = ({ onClose, router }: any) => (
  <div className="w-full max-w-md mx-auto bg-white border border-gray-200 rounded-lg shadow-md">
    <div className="text-center p-6 pb-4">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <CreditCard className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900">Out of Credits</h2>
      <p className="text-base text-gray-600 mt-2">
        You've used all your available credits. Either wait for your credits to
        set, or purchase more credits.
      </p>
    </div>
    <div className="px-6 pb-6 space-y-4">
      <div className="rounded-lg bg-red-50 p-4 border border-red-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm  text-red-800">Current Balance</span>
          <span className="text-xs px-2 py-1 rounded bg-red-600 text-white">
            0 Credits
          </span>
        </div>
        <p className="text-sm text-red-700">
          Purchase more credits or wait for your credits to reset.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => {
            onClose();
            router.push("/add-credits");
          }}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded inline-flex items-center justify-center"
        >
          <CreditCard className="mr-2 h-4 w-4" strokeWidth={2} />
          <span className="font-semibold">Purchase Credits</span>
        </button>
        <button
          onClick={() => {
            onClose();
            router.push("/");
          }}
          className="w-full border border-gray-300 hover:bg-gray-100 text-gray-800  py-2 px-4 rounded"
        >
          <span className="font-semibold">Go to Homepage</span>
        </button>
      </div>
    </div>
  </div>
);

const ErrorOffline = ({ onClose, router }: any) => (
  <div className="w-full max-w-md mx-auto bg-white border border-gray-200 rounded-lg shadow-md">
    <div className="text-center p-6 pb-4">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <Server className="h-8 w-8 text-gray-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900">Server Offline</h2>
      <p className="text-base text-gray-600 mt-2">
        We're experiencing technical difficulties. Please try again in a few
        moments.
      </p>
    </div>
    <div className="px-6 pb-6 space-y-4">
      <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-sm  text-gray-800">Service Status</span>
        </div>
        <p className="text-sm text-gray-600">
          Our team has been notified and is working to resolve this issue.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => {
            onClose();
            router.push("/contact");
          }}
          className="w-full bg-gray-700 hover:bg-gray-800 text-white  py-2 px-4 rounded inline-flex items-center justify-center"
        >
          <Mail className="mr-2 h-4 w-4" />
          <span className="font-semibold">Contact Support</span>
        </button>
        <button
          onClick={() => {
            onClose();
            router.push("/");
          }}
          className="w-full border border-gray-300 hover:bg-gray-100 text-gray-800  py-2 px-4 rounded"
        >
          <span className="font-semibold">Go to Homepage</span>
        </button>
      </div>
    </div>
  </div>
);
