import { Suspense } from "react";
import AccountSettingsPage from "./ProfileClient";
import Loader from "@/components/Loader";

export default function Page() {
  return (
    <Suspense fallback={<Loader/>}>
      <AccountSettingsPage />
    </Suspense>
  );
}