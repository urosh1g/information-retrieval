import "@/styles/globals.css";
import type { AppProps } from "next/app";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function App({ Component, pageProps }: AppProps) {
  return <>
    <Component {...pageProps} />
    <ToastContainer
      autoClose={2500}
      theme="dark"
    />
  </>;
}
