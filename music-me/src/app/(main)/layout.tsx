import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isGuest } from "@/lib/guest";
import { MainNav } from "@/components/layout/main-nav";
import { GuestNotice } from "@/components/auth/guest-notice";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  // signed-out visitors need to log in, unless they chose to look around as a guest
  const guest = !session?.user && (await isGuest());
  if (!session?.user && !guest) redirect("/login");

  return (
    <div className="min-h-screen">
      <MainNav user={session?.user ?? null} />
      {guest && <GuestNotice />}
      {/* top nav on wide screens, bottom app bar on phones */}
      <main className="pb-16 sm:pb-0 sm:pt-16">{children}</main>
    </div>
  );
}
