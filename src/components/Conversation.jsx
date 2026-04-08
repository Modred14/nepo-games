"use client";

export default function Conversation({ buyerId, GameDetails }) {
  function maskEmail(email) {
    const [localPart, domain] = email.split("@");

    if (!localPart || localPart.length < 3) {
      return email; // too short to safely mask
    }

    const start = localPart.slice(0, 2); // "em"
    const end = localPart.slice(-2); // "ur"

    return `${start}***${end}@${domain}`;
  }

  return (
    <div className="min-h-screen w-full flex bg-cover bg-center">
      <div></div>{" "}
      <div className="relative min-h-screen w-full">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/conversation.png')" }}
        />

        <div className="absolute inset-0 bg-white/80" />

        <div className="relative z-10 ">
          <div className="p-2 px-4">
            <div className="p-2 px-5 rounded-3xl bg-blue-500/15 border border-blue-700/50">
              <div className="flex gap-2 items-center">
                <img
                  src="/profile.png"
                  alt="User Image"
                  className="h-10 w-10 border border-gray-100 rounded-full overflow-hidden object-cover"
                />
                <div>
                  <p className="sm:text-base text-sm font-semibold text-blue-700">
                    UserName
                  </p>
                  <p className="sm:text-sm text-xs text-gray-800">
                    {maskEmail("favourdomirin@gmail.com")}
                  </p>
                </div>{" "}
              </div>
              <div className="fixed bottom-0 left-0 w-full lg:left-[320px] lg:w-[calc(100%-320px)] p-3 sm:p-4 bg-transparent">
                <div className="flex items-center gap-2 sm:gap-3 bg-white/90 backdrop-blur-md border rounded-full px-3 sm:px-4 py-2 sm:py-3 shadow-md">
                  <div className="w-6 h-6 bg-blue-500 rounded-sm flex items-center justify-center text-white text-xs">
                    N
                  </div>

                  <input
                    type="text"
                    placeholder="Type your message"
                    className="flex-1 outline-none bg-transparent text-sm"
                  />

                  <button className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition">
                    ➤
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
