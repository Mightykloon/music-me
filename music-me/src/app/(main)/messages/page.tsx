import { redirect } from "next/navigation";

export default function MessagesPage() {
  redirect("/community?tab=messages");
}
