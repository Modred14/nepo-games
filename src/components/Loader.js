"use client";


export default function Loader() {

  return (
    <>

        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-blue-700 p-3 rounded-2xl">
              {" "}
              <img
                src="/logo.png"
                alt="Nepogames"
                className="w-16 animate-pulse"
              />
            </div>

            <p className="text-blue-700 font-semibold">Loading Nepogames...</p>

            <div className="w-40 h-1 bg-gray-200 rounded overflow-hidden">
              <div className="h-full bg-blue-600 animate-loading w-1/2"></div>
            </div>
          </div>
        </div>
     

    
    </>
  );
}
