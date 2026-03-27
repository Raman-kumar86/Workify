import { createContext, useContext, useMemo, useState } from "react";
import AnimatedPopup from "../components/constants/AnimatedPopup.jsx";

const PopupContext = createContext(null);

export const PopupProvider = ({ children }) => {
  const [popup, setPopup] = useState(null);

  const showPopup = ({
    type = "info",
    title,
    message,
    duration = 2800,
  }) => {
    setPopup({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      title,
      message,
      duration,
    });
  };

  const hidePopup = () => {
    setPopup(null);
  };

  const value = useMemo(
    () => ({
      showPopup,
      hidePopup,
    }),
    [],
  );

  return (
    <PopupContext.Provider value={value}>
      {children}
      <AnimatedPopup popup={popup} onClose={hidePopup} />
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("usePopup must be used within a PopupProvider");
  }
  return context;
};
