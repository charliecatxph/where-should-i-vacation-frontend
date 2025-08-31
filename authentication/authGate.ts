import { GetServerSidePropsContext } from "next";
import jwt from "jsonwebtoken";
import axios from "axios";
import { parse } from "cookie";

const redirectIfLoggedIn = ["/login", "/finish-google-sso"];
const protectedRoutes = [
  "/generate",
  "/generate-itinerary",
  "/history",
  "/itinerary-history",
  "/vacation",
];

const stripe = ["/purchase-success"];

export const authGate = async (ctx: GetServerSidePropsContext) => {
  const cookie = parse(ctx.req.headers.cookie || "")?.refreshToken || "";
  const { query } = ctx;
  const server = process.env.SERVER;
  const absoluteServerUrl = `${process.env.ORIGIN}/api`;

  const resolvedUrl = ctx.resolvedUrl.split("?")[0];

  try {
    const res = await axios.post(
      `${absoluteServerUrl}/user-rehydration`,
      {},
      {
        headers: {
          Cookie: cookie,
        },
      }
    );

    const userData = {
      ...(jwt.decode(res.data.token) as object),
      token: res.data.token,
    };

    if (stripe.some((route) => route === resolvedUrl) && !query.session_id) {
      return {
        redirect: {
          destination: "/404",
          permanent: false,
        },
      };
    }

    if (resolvedUrl === "/vacation" && !query.place) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    if (resolvedUrl === "/finish_google_sso" && !query.code) {
      return {
        redirect: {
          destination: "/404",
          permanent: false,
        },
      };
    }

    if (redirectIfLoggedIn.some((route) => route === resolvedUrl)) {
      return {
        redirect: {
          destination: "/404",
          permanent: false,
        },
      };
    }

    return {
      props: {
        user: userData,
        queries: query,
        api: server,
      },
    };
  } catch (e) {
    console.log(e);
    if (protectedRoutes.some((route) => route === resolvedUrl)) {
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    return {
      props: {
        user: null,
        queries: query,
        api: server,
      },
    };
  }
};
