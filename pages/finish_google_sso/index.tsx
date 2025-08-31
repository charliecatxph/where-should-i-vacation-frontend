import { useEffect } from "react";
import { useRouter } from "next/router";
import { authGate } from "@/authentication/authGate";
import { GetServerSidePropsContext } from "next";
import { useQuery } from "@tanstack/react-query";
import axios, { Axios, AxiosError } from "axios";
import jwt from "jsonwebtoken";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/features/user";

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const udc = await authGate(ctx);
  return udc;
};

export default function FinishGoogleSSO({ api, queries }: any) {
  const router = useRouter();
  const { isError, error, isPending } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await axios.post(
        `${api}/google-sso`,
        {
          code: queries?.code || "",
        },
        { withCredentials: true }
      );

      return res.data.token;
    },
    retry: 0,
    staleTime: 0,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isPending) return;
    if (
      isError &&
      error &&
      ((error as AxiosError)?.response?.data as any).err
    ) {
      setTimeout(() => {
        router.push("/");
      }, 5000);
      return;
    }

    if (!isError) {
      router.push("/");
    }
  }, [isError, error, isPending]);

  return (
    <main className="min-h-screen grid place-items-center bg-white text-black">
      <div className="w-full max-w-sm px-6 text-center">
        {isPending && (
          <>
            <div className="mb-4 text-base font-medium">
              Logging in with Google
            </div>
            <div className="mb-6 text-sm text-zinc-600">Please wait...</div>
            <div className="flex items-center justify-center">
              <span className="inline-block h-8 w-8 rounded-full border-2 border-zinc-300 border-t-black animate-spin" />
            </div>
          </>
        )}

        {isError && (
          <>
            <div className="mb-4 text-base font-medium">
              {((error as AxiosError)?.response?.data as any).err ||
                "An error occurred."}
            </div>
            <div className="mb-6 text-sm text-zinc-600">
              Redirecting you in 5 seconds....
            </div>
            <div className="flex items-center justify-center">
              <span className="inline-block h-8 w-8 rounded-full border-2 border-zinc-300 border-t-black animate-spin" />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
