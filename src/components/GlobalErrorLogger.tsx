import { useEffect } from "react";

const GlobalErrorLogger = () => {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      console.error("[GlobalError]", event.message, event.error);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      console.error("[GlobalUnhandledRejection]", event.reason);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
};

export default GlobalErrorLogger;
