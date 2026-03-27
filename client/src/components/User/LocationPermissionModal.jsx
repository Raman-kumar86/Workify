import React from "react";
import { MapPin } from "lucide-react";

export default function LocationPermissionModal({
  onEnableLocation,
  isLoading,
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>

      <div className="relative bg-white/10 border border-white/20 p-8 rounded-3xl max-w-md w-full mx-4 shadow-2xl backdrop-blur-xl text-center">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg mb-6 animate-bounce">
          <MapPin size={40} className="text-white fill-white" />
        </div>

        {/* Text */}
        <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
          Location Required
        </h2>
        <p className="text-gray-300 mb-8 font-medium leading-relaxed">
          To connect you with the best workers in your area, we need access to
          your location. Please enable location services to proceed.
        </p>

        {/* Button */}
        <button
          onClick={onEnableLocation}
          disabled={isLoading}
          className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? "Detecting..." : "Enable Location"}
        </button>
      </div>
    </div>
  );
}
