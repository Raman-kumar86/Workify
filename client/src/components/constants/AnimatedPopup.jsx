import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, CircleX, Info } from "lucide-react";

const popupMeta = {
  success: {
    title: "Success",
    icon: CheckCircle2,
    className: "popup-success",
  },
  error: {
    title: "Failed",
    icon: CircleX,
    className: "popup-error",
  },
  warning: {
    title: "Warning",
    icon: CircleAlert,
    className: "popup-warning",
  },
  info: {
    title: "Notice",
    icon: Info,
    className: "popup-info",
  },
};

const AnimatedPopup = ({ popup, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!popup) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    const exitTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, Math.max(500, popup.duration - 250));

    const closeTimer = window.setTimeout(() => {
      onClose();
    }, popup.duration);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(closeTimer);
    };
  }, [popup, onClose]);

  const meta = useMemo(() => {
    if (!popup?.type) return popupMeta.info;
    return popupMeta[popup.type] || popupMeta.info;
  }, [popup?.type]);

  if (!popup) {
    return null;
  }

  const Icon = meta.icon;

  return (
    <div className="popup-root" aria-live="polite" aria-atomic="true">
      <div
        className={`popup-shell ${meta.className} ${
          isVisible ? "popup-enter" : "popup-exit"
        }`}
      >
        <div className="popup-glow" />
        <div className="popup-icon-wrap">
          <Icon size={24} strokeWidth={2.4} />
        </div>

        <div className="popup-content">
          <h4>{popup.title || meta.title}</h4>
          <p>{popup.message}</p>
        </div>

        <div
          className="popup-progress"
          style={{ animationDuration: `${popup.duration}ms` }}
        />
      </div>
    </div>
  );
};

export default AnimatedPopup;