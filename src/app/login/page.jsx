import PageLoader from "@/components/PageLoader";
import LoginClient from "./LoginClient";
import Reveal from "../reveal";

export default function LoginPage() {
  return (
    <PageLoader>
      <Reveal>
        <LoginClient />
      </Reveal>
    </PageLoader>
  );
}
