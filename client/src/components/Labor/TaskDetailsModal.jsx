import React from 'react';
import {
  X,
  MapPin,
  Clock,
  Briefcase,
  IndianRupee,
  Calendar,
  ShieldCheck,
  Navigation,
  CheckCircle
} from 'lucide-react';
import Map from '../../map/User/Map';
import useCategories from '../../hooks/useCategories';

const TaskDetailsModal = ({ task, onClose, onAccept, accepting, isActiveTask, hasActiveTask, hasOutstandingFees, outstandingFeeAmount, onReject, onNavigate, onComplete, onMarkArrived, arrivedLoading, activeTaskStatus, onPayNow }) => {
  if (!task) return null;

  const { categories } = useCategories();

  const resolvedWorkerPercent =
    typeof task.workerFeePercent === 'number'
      ? task.workerFeePercent
      : typeof task.platformFeePercent === 'number'
        ? 100 - task.platformFeePercent
        : 90;
  const workerKeeps = Math.round((task.price || 0) * (resolvedWorkerPercent / 100));
  const resolvedTaskType = categories.find((category) => category._id === task.taskType)?.name || task.taskType;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Flexible';
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Convert task location to format expected by Map component
  const taskLocation = task.location?.coordinates
    ? { lat: task.location.coordinates[1], lng: task.location.coordinates[0] }
    : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row relative animate-scale-in">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full hover:bg-white transition-all shadow-lg"
        >
          <X size={20} />
        </button>

        {/* Left Side - Map */}
        <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-gray-100">
          <Map
            selectedLocation={taskLocation}
            readOnly={true}
            onLocationSelect={() => { }}
          />

          {/* Map Overlay Info */}
          <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur px-4 py-3 rounded-xl shadow-lg border border-gray-100 z-1000">
            <div className="flex items-start gap-3">
              <div className="bg-black p-2 rounded-lg text-white">
                <Navigation size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Location</h4>
                <p className="text-sm font-bold line-clamp-2">{task.address || "Address not provided"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Details */}
        <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto custom-scrollbar flex flex-col">

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                {resolvedTaskType}
              </span>
              {task.subcategory && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  {task.subcategory}
                </span>
              )}
              {isActiveTask && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                  ● Active
                </span>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-tight mb-2">
              {task.title}
            </h2>
            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
              <span>Posted {new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Price Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Task Price</p>
              <h3 className="text-3xl font-black tracking-tighter flex items-center">
                <IndianRupee size={24} strokeWidth={3} />
                {task.price}
              </h3>
              <p className="text-sm font-bold text-gray-600 tracking-wide mt-2">
                Earnings: ₹{workerKeeps}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-green-600 uppercase tracking-widest bg-green-100 px-2 py-1 rounded-lg">
                {resolvedWorkerPercent}% after platform fee
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-2xl border border-gray-100 hover:border-black transition-colors group">
              <Clock size={20} className="text-gray-400 mb-2 group-hover:text-black transition-colors" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Duration</p>
              <p className="font-bold text-sm">
                {task.estimatedDurationMinutes ? `${task.estimatedDurationMinutes} mins` : 'Flexible'}
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-gray-100 hover:border-black transition-colors group">
              <Calendar size={20} className="text-gray-400 mb-2 group-hover:text-black transition-colors" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Start Time</p>
              <p className="font-bold text-sm">{formatDate(task.scheduledStartAt)}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8 grow">
            <h4 className="text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2">
              <Briefcase size={16} /> Task Description
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed p-4 bg-gray-50 rounded-2xl border border-gray-100">
              {task.description || "No description provided."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto pt-4 border-t border-gray-100">
            {isActiveTask ? (
              <>
                {/* Active task actions — vary by current status */}
                <div className="flex gap-3">

                  {/* inProgress: Navigate hidden, show Complete instead */}
                  {activeTaskStatus === "inProgress" ? (
                    <button
                      onClick={() => { onClose(); onComplete && onComplete(); }}
                      className="flex-1 bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-3"
                    >
                      <CheckCircle size={18} /> Complete Task
                    </button>
                  ) : (
                    <button
                      onClick={onNavigate}
                      className="flex-1 bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-3"
                    >
                      <Navigation size={18} /> Navigate
                    </button>
                  )}

                  {activeTaskStatus === "assigned" && (
                    <button
                      onClick={onMarkArrived}
                      disabled={arrivedLoading}
                      className="flex-1 bg-green-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-green-500 active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-60"
                    >
                      <MapPin size={18} /> {arrivedLoading ? "Sending…" : "Mark Arrived"}
                    </button>
                  )}

                  <button
                    onClick={onReject}
                    className="bg-red-500/10 text-red-500 px-5 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-[0.98] border border-red-500/20 hover:border-red-500 flex items-center justify-center"
                    title="Cancel Task"
                  >
                    <X size={22} />
                  </button>
                </div>
                <p className="text-center text-[10px] text-gray-400 font-medium mt-3">
                  You've already accepted this task.
                </p>
              </>
            ) : hasOutstandingFees ? (
              <>
                <button
                  disabled
                  className="w-full bg-amber-100 text-amber-700 py-4 rounded-xl font-black uppercase tracking-widest text-sm cursor-not-allowed flex items-center justify-center gap-3 border border-amber-200"
                >
                  <ShieldCheck size={18} /> Clear Previous Platform Fee First
                </button>
                <button
                  onClick={() => { onClose(); onPayNow && onPayNow(); }}
                  className="w-full mt-3 bg-black text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-colors"
                >
                  Go To Payments
                </button>
                <p className="text-center text-[10px] text-gray-400 font-medium mt-3">
                  Outstanding fee due: ₹{outstandingFeeAmount}
                </p>
              </>
            ) : hasActiveTask ? (
              <>
                <button
                  disabled
                  className="w-full bg-gray-200 text-gray-500 py-4 rounded-xl font-black uppercase tracking-widest text-sm cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <ShieldCheck size={18} /> Complete Your Active Task First
                </button>
                <p className="text-center text-[10px] text-gray-400 font-medium mt-3">
                  You already have an active task. Finish it before accepting another one.
                </p>
              </>
            ) : (
              <>
                <button
                  onClick={() => onAccept(task._id)}
                  disabled={accepting}
                  className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {accepting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <ShieldCheck size={18} /> Accept Task Now
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-gray-400 font-medium mt-3">
                  By accepting, you agree to fulfill this task as per guidelines.
                </p>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
