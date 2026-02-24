"use client";

export default function Reviews() {
  const reviews = [
    {
      img: "/oke.jpg",
      name: "Charl Oke",
      userName: "@oke",
      message:
        "Customer support responded fast and helped me resolve a minor issue quickly. That alone makes this platform stand out.",
    },
    {
      img: "/peters.jpg",
      name: "Ray Peters",
      userName: "@peters",
      message:
        "I’ve tried other marketplaces before, but this one feels way more secure. Clean design, smooth process, and no stress during transfer.",
    },
    {
      img: "/faq.jpg",
      name: "Sarah Faq",
      userName: "@faq",
      message:
        "I’ve completed multiple trades on Nepo Games and every single one went smoothly. This is the future of game account trading",
    },
    {
      img: "/jg.jpg",
      name: "Jig Peters",
      userName: "@jig",
      message:
        "I bought a high-level COD account and the transfer was smooth. Escrow protection is a game changer",
    },
    {
      img: "/henry.jpg",
      name: "Henry Daniel",
      userName: "@henry",
      message:
        "What I love most is the verification system. You can actually tell they care about keeping scammers away.",
    },
    {
      img: "/sarah.jpg",
      name: "Sarah Logans",
      userName: "@sarah",
      message:
        "Sold my FIFA account in less than 24 hours. The dashboard is simple and professional. Definitely using Nepo Games again.",
    },
    // { img: "", name: "", userName: "", message: "" },
  ];

  // duplicate reviews for infinite scroll
  const column = [...reviews, ...reviews]; // only 2 copies
  // keep original length
  return (
    <div className="reviewGrid grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 overflow-hidden h-[700px] p-10">
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
    <div className="border backdrop-blur-xl shadow-sm bg-gray-50/50 rounded-2xl  border-[#0000FF]/50 mr-2">
      <div className="flex items-center gap-2 px-4 pt-2 text-[#0000FF]">
        <img src={review.img} className="h-15 w-15 rounded-full" />

        <div>
          <p className="font-bold">{review.name}</p>
          <p className="text-sm">{review.userName}</p>
        </div>
      </div>

      <div className="mt-3 w-full overflow-hidden leading-none">
        <svg
          viewBox="0 0 100 10"
          preserveAspectRatio="none"
          className="w-full h-1"
        >
          <polyline
            points="0,10 5,0 10,10 15,0 20,10 25,0 30,10 35,0 40,10 45,0 50,10 55,0 60,10 65,0 70,10 75,0 80,10 85,0 90,10 95,0 100,10"
            fill="none"
            stroke="#1010FF"
            strokeWidth="4"
          />
        </svg>
      </div>

      <div className="font-bold p-3 text-sm">{review.message}</div>
    </div>
  );
}
