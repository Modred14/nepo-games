import { motion } from "framer-motion";
import { Star, ShoppingCart, FileText, User, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardStats() {
  const [listedAccounts, setListedAccounts] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [totalSales, setTotalSales] = useState(0.0);
  const [rating, setRating] = useState(0.0);
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
      value: rating.toFixed(1),
      desc: "Based on customer reviews",
      other1: "Customer reviews",
      icon: Star,
      stars: Math.round(rating),
    },
  ];

  return (
    <div className="w-full sm:-mb-4 pt-3 sm:pt-4 space-y-4">
      <div className="grid grid-cols-2 jt:flex flex-wrap justify-center gap-1.5 xs:gap-2 sm:gap-3 lg:gap-4">
        {stats.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="group rounded-xl h-full border justify-center border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 px-1.5 sm:px-3 py-2 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 sm:rounded-lg sm:block jt:hidden rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm group-hover:scale-105 transition">
                  <item.icon size={14} className="sm:w-4 sm:h-4" />
                </div>
                <div>
                  <p className="text-xs  flex justify-between sm:items-center font-semibold text-gray-800">
                    <span>{item.title}</span>
                    {item.stars >= 0 && (
                      <span className="text-xs pt-0.5 font-bold text-gray-700">
                        {item.value}
                      </span>
                    )}
                  </p>
                  {item.stars >= 0 ? (
                    <div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[...Array(5)].map((_, index) => {
                          const stars = Number(item.stars) || 0;

                          return (
                            <Star
                              key={index}
                              size={12}
                              className={
                                index < stars
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }
                            />
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-[10px] hidden lg:block text-gray-500">
                        <div>
                          <span className="font-bold">
                            {" "}
                            {formatNumber(item.value)}
                          </span>{" "}
                          {item.desc}
                        </div>
                      </p>
                      <p className="text-[10px] lg:hidden text-gray-500">
                        <div className="flex items-center h-full gap-1">
                          {" "}
                          <span className="font-bold">
                            {" "}
                            {formatNumber(item.value)}
                          </span>{" "}
                          {item.other1}
                        </div>
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        <motion.div
          onClick={() => {
            router.push("/sell-game");
          }}
          initial={{ opacity: 0, y: 12 }}
          className="cursor-pointer"
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: stats.length * 0.08 }}
        >
          <div className="group bg-blue-100 rounded-xl h-full border justify-center border-gray-200 shadow-sm hover:shadow-md transition-all duration-300  px-2 sm:px-3 py-2 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm transition group-hover:scale-105">
                <Plus size={14} className="sm:w-4 sm:h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">
                  Sell Account
                </p>

                <p className="text-[10px] hidden lg:block text-gray-600">
                  {" "}
                  <span className="font-semibold">Click here </span>to list your
                  account for sale
                </p>
                <p className="text-[10px] font-semibold lg:hidden text-gray-600">
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
