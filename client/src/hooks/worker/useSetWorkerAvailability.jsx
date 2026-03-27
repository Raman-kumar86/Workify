import { useState } from "react";
import axiosInstance from "../../api/axios.jsx";

const useSetWorkerAvailability = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isOnline, setIsOnline] = useState(null);

  const setAvailability = async (status) => {
    if(loading) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let location = null;

      // Only fetch location if going online
      if (status === true) {
        if (!navigator.geolocation) {
          throw new Error("Geolocation is not supported by your browser");
        }

        location = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              });
            },
            (err) => {
              reject(new Error("Unable to retrieve your location"));
            }
          );
        });
      }

      const payload = {
        isOnline: status,
      };

      if (location) {
        payload.location = location;
      }

      const response = await axiosInstance.patch("/api/worker/availability", payload);

      setSuccess(true);
      setIsOnline(response.data.isOnline);
      return response.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to update availability";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { setAvailability, loading, error, success, isOnline };
};

export default useSetWorkerAvailability;
