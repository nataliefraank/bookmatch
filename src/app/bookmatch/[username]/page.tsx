import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import BookmatchClient from "./BookmatchClient";

export default async function BookmatchPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/pages/login");
  }

  const { username: raw } = await params;
  const decoded = decodeURIComponent(raw);
  if (decoded.toLowerCase() !== session.username.toLowerCase()) {
    redirect("/pages/login");
  }

  return <BookmatchClient username={session.username} />;
}
