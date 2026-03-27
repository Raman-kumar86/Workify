const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
        Loading…
      </p>
    </div>
  </div>
);

export default PageLoader;