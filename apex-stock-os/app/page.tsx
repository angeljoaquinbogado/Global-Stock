import { redirect } from "next/navigation";

/** Production uses the SAME React Native / Expo components that power Expo Go.
 * Next.js continues serving API, legal pages and the optional /classic rollback.
 */
export default function HomePage() {
  redirect("/native-app/index.html");
}
