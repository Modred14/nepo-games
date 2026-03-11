"use client";

export default function Reviews() {
  const reviews = [
    {
      img: "/faq.jpg",
      name: "Shalom Faith",
      userName: "Buyer",
      message:
        "What I love most is the verification system. You can actually tell they care about keeping scammers away.",
    },
    {
      img: "/oke.jpg",
      name: "Joshua Balogun",
      userName: "Verified Trader",
      message:
        "Customer support responded fast and helped me resolve a minor issue quickly. That alone makes this platform stand out.",
    },

    {
      img: "/jg.jpg",
      name: "Jig Peters",
      userName: "Buyer",
      message:
        "I bought a high-level COD account and the transfer was smooth. Escrow protection is a game changer",
    },

    {
      img: "/henry.jpg",
      name: "Henry Peter",
      userName: "Verified Trader",
      message:
        "I’ve completed multiple trades on Nepo Games and every single one went smoothly. This is the future of game account trading",
    },
    {
      img: "/peters.jpg",
      name: "Ray Peters",
      userName: "Buyer",
      message:
        "I’ve tried other marketplaces before, but this one feels way more secure. Clean design, smooth process, and no stress during transfer.",
    },
    {
      img: "/sarah.jpg",
      name: "Sarah Logans",
      userName: "Verified Trader",
      message:
        "Sold my FIFA account in less than 24 hours. The dashboard is simple and professional. Definitely using Nepo Games again.",
    },
  ];

  // duplicate reviews for infinite scroll
  const column = [...reviews, ...reviews]; // only 2 copies
  // keep original length
  return (
    <div className="reviewGrid grid gap-10 overflow-hidden h-[700px] p-10">
      {" "}
      {/* Column 1 UP */}
      <Column reviews={column} direction="up" />
      <div className="hidden sm:block">
        {/* Column 2 DOWN */}
        <Column reviews={column} direction="down" />
      </div>
      <div className="hidden md:block">
        {/* Column 3 UP */}
        <Column reviews={column} direction="up" />
      </div>
      <div className="hidden lg:block">
        <Column reviews={column} direction="down" />
      </div>
      {/* Column 4 DOWN */}
    </div>
  );
}

function Column({ reviews, direction }) {
  return (
    <div className="flex-1 group">
      <div
        className={[
          "flex flex-col gap-6 marquee",
          direction === "up" ? "animate-scrollUp" : "animate-scrollDown",
        ].join(" ")}
      >
        {reviews.map((review, index) => (
          <Card
            review={review}
            key={`${review.userName}-${index}`}
            isClone={index >= reviews.length / 2}
          />
        ))}
      </div>
    </div>
  );
}

function Card({ review }) {
  return (
    <div className="border backdrop-blur-xl shadow-sm bg-linear-to-b from-[#9476FA] to-[#8B3FF5] rounded-2xl  border-white mr-2">
      <div className="flex items-center gap-2 px-4 pt-2 text-[#0000FF]">
        <img src={review.img} className="h-15 w-15 rounded-full" />

        <div>
          <p className="font-bold text-white">{review.name}</p>
          <p className="text-sm text-[#75ff75]">{review.userName}</p>
        </div>
      </div>

      <div className=" p-3 px-5 text-sm text-white">
        {review.message}
      </div>
    </div>
  );
}
