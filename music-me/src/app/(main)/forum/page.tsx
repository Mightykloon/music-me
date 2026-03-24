import { redirect } from "next/navigation";

export default function ForumPage() {
  redirect("/community?tab=forum");
}
