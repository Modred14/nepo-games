import { useRouter } from "next/navigation";

export function usePageTransition() {
  const router = useRouter();

  const navigate = (href) => {
    const el = document.querySelector(".page-fader-in");
    if (el) {
      el.classList.add("page-fader-out");
      el.classList.remove("page-fader-in");
      setTimeout(() => router.push(href), 280);
    } else {
      router.push(href);
    }
  };

  return navigate;
}