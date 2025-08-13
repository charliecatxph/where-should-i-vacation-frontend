import { authGate } from "@/authentication/authGate";
import { GetServerSidePropsContext } from "next";

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const udc = await authGate(ctx);
  return udc;
};

export default function TTY() {
  return <>running authgate</>;
}
