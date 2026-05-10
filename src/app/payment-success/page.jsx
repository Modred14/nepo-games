import { Suspense } from "react";
import PaymentSuccess from "./Paymentsuccess";
import Loader from "@/components/Loader";

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<Loader />}>
      <PaymentSuccess />
    </Suspense>
  );
}