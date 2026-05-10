import { Suspense } from "react";
import AccountSettingsClient from "./AccountSettingsClient";
import Loader from "@/components/Loader";

export default function Page() {
  return (
    <Suspense fallback={<Loader/>}>
      <AccountSettingsClient />
    </Suspense>
  );
}