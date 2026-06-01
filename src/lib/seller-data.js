import { motion } from "framer-motion";
import { Star, ShoppingCart, FileText, User, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm px-3 py-2 flex flex-col gap-3 animate-pulse h-full">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-gray-100 w-8 h-8" />
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="h-2.5 bg-gray-100 rounded w-3/4" />
          <div className="h-2 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardStats() {
  const [listedAccounts, setListedAccounts] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [totalSales, setTotalSales] = useState(0.0);
  const [rating, setRating] = useState(0.0);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        const res = await fetch("/api/user/seller");
        if (!res.ok) {
          throw new Error("Failed to fetch seller data");
        }
        const data = await res.json();
        setListedAccounts(data.total || 0);
        setRating(data.averageRating || 0);
        if (data.games) {
          const pending = data.games.filter(
            (g) => g.status === "pending",
          ).length;
          setPendingOrders(pending);
          const sales = data.games.reduce(
            (acc, g) => acc + (g.price_value || 0),
            0,
          );
          setTotalSales(sales);
        }
      } catch (err) {
        console.error("Seller fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellerData();
  }, []);
  const formatNumber = (num) => {
    if (num >= 1_000_000_000) {
      return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
    }
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toString();
  };
  const displayRating = Math.min(parseFloat(rating.toFixed(1)), 5);
  const starCount = Math.min(Math.round(displayRating), 5);

  const stats = [
    {
      title: "Listed Account",
      value: listedAccounts,
      desc: `Listed account(s)`,
      other1: `Listed account(s)`,
      icon: User,
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      desc: `Pending order(s)`,
      other1: `Pending order(s)`,
      icon: FileText,
    },
    {
      title: "Total Sales",
      value: `₦ ${formatNumber(totalSales)}`,
      desc: `Total sales`,
      other1: `Total sales`,
      icon: ShoppingCart,
    },
    {
      title: "Rating",
      value: displayRating.toFixed(1),
      desc: "Based on customer reviews",
      other1: "Customer reviews",
      icon: Star,
      stars: starCount,
    },
  ];

  return (
    <div className="w-full sm:-mb-4 pt-3 sm:pt-4 space-y-4">
      <div
        className="
          grid grid-cols-2
          jt:flex flex-wrap justify-center
          gap-1.5 xs:gap-2 sm:gap-3 lg:gap-4
        "
      >
        {/* ── loading skeletons ── */}
        {
          /* ── stat cards ── */
          stats.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, ease: "easeOut" }}
              className="h-full"
            >
              <div
                className="
                    group relative h-full overflow-hidden
                    rounded-xl border border-gray-100
                    bg-white
                    shadow-sm hover:shadow-md
                    transition-all duration-300
                    px-1.5 sm:px-3 py-2
                    flex flex-col gap-3
                  "
              >
                {/* subtle top-accent line */}
                <span
                  className="
                      absolute inset-x-0 top-0 h-[2px]
                      bg-gradient-to-r from-blue-400 via-indigo-500 to-violet-400
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-300
                    "
                />

                <div className="flex items-center gap-2">
                  {/* icon pill */}
                  <div
                    className="
                        flex-shrink-0
                        p-1.5 sm:p-2
                        rounded-lg
                        sm:block jt:hidden
                        bg-gradient-to-br from-blue-500 to-indigo-600
                        text-white shadow-sm
                        group-hover:scale-105 group-hover:shadow-indigo-200
                        transition-transform duration-200
                      "
                  >
                    <item.icon size={14} className="sm:w-4 sm:h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* title row */}
                    <p className="text-xs flex justify-between sm:items-center font-semibold text-gray-800 leading-tight">
                      <span className="truncate">{item.title}</span>
                      {item.stars !== undefined &&
                        (isLoading ? (
                          <div></div>
                        ) : (
                          <span className="text-xs pt-0.5 font-bold text-gray-700 ml-1 tabular-nums">
                            {item.value}
                          </span>
                        ))}
                    </p>

                    {/* stars OR value+desc */}
                    {item.stars !== undefined ? (
                      <div className="flex items-center gap-0.5 mt-1">
                        {isLoading
                          ? [...Array(5)].map((_, idx) => (
                              <Star
                                key={idx}
                                size={11}
                                className="fill-gray-100 animate-pulse text-gray-200"
                              />
                            ))
                          : [...Array(5)].map((_, idx) => {
                              const stars = Number(item.stars) || 0;

                              return (
                                <Star
                                  key={idx}
                                  size={11}
                                  className={
                                    idx < stars
                                      ? "fill-amber-400 text-amber-400"
                                      : "fill-gray-100 text-gray-200"
                                  }
                                />
                              );
                            })}
                      </div>
                    ) : (
                      <>
                        {/* desktop */}
                        <p className="text-[10px] hidden lg:flex items-baseline gap-1 text-gray-500 mt-0.5">
                          {isLoading ? (
                            
                              <span className="h-2 w-4 rounded bg-gray-200 animate-pulse inline-block" />
                         
                          ) : (
                            <span className="font-bold text-gray-700 tabular-nums">
                              {formatNumber(item.value)}
                            </span>
                          )}
                          <span>{item.desc}</span>
                        </p>
                        {/* mobile */}
                        <p className="text-[10px] lg:hidden flex items-center gap-1 text-gray-500 mt-0.5">
                          {isLoading ? (
                            <span className="h-2 w-4 rounded bg-gray-200 animate-pulse inline-block" />
                          ) : (
                            <span className="font-bold text-gray-700 tabular-nums">
                              {formatNumber(item.value)}
                            </span>
                          )}
                          <span>{item.other1}</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        }

        {/* ── sell account CTA ── */}
        <motion.div
          onClick={() => router?.push("/sell-game")}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: stats.length * 0.08, ease: "easeOut" }}
          className="cursor-pointer col-span-2 h-full"
        >
          <div
            className="
              group relative h-full overflow-hidden
              rounded-xl border border-blue-200/70
              bg-gradient-to-br from-blue-50 to-indigo-50
              shadow-sm hover:shadow-md hover:border-blue-300
              transition-all duration-300
              px-2 sm:px-3 py-2
              flex flex-col gap-3
            "
          >
            {/* decorative glow blob */}
            <span
              className="
                pointer-events-none absolute -right-4 -top-4 h-16 w-16
                rounded-full bg-indigo-200/40 blur-xl
                group-hover:bg-indigo-300/50
                transition-colors duration-300
              "
            />

            <div className="flex items-center gap-2">
              <div
                className="
                  flex-shrink-0
                  p-1.5 sm:p-2
                  rounded-md sm:rounded-lg
                  bg-gradient-to-br from-blue-500 to-indigo-600
                  text-white shadow-sm
                  group-hover:scale-105 group-hover:shadow-indigo-300
                  transition-transform duration-200
                "
              >
                <Plus size={14} className="sm:w-4 sm:h-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 leading-tight">
                  Sell Account
                </p>

                {/* desktop */}
                <p className="text-[10px] hidden lg:block text-gray-500 mt-0.5">
                  <span className="font-semibold text-blue-600">
                    Click here
                  </span>{" "}
                  to list your account for sale
                </p>

                {/* mobile */}
                <p className="text-[10px] lg:hidden font-semibold text-blue-600 mt-0.5">
                  Start earning
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
