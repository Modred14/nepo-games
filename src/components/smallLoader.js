export default function SmallLoader() {
  return (
    <>
      <div className=" flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-15 h-15 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>

          <p className="text-black font-semibold">
            Loading<span className="loading-dots"></span>
          </p>
        </div>
      </div>
    </>
  );
}
