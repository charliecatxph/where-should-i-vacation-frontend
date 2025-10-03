import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { ModalProvider, useModal } from "@/components/modals/ModalContext";
import Modal from "@/components/modals/Modal";
import { useState } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <Provider store={store}>
            <ModalProvider>
              <GoogleReCaptchaProvider reCaptchaKey="6LfSKLorAAAAALqaEjIbQO3q0l8xBErGvMKFdUqu">
                <Component {...pageProps} />
              </GoogleReCaptchaProvider>
              <Modal />
              <ReactQueryDevtools />
            </ModalProvider>
          </Provider>
        </MantineProvider>
      </QueryClientProvider>
    </>
  );
}
