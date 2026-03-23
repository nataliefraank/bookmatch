import { redirect } from "next/navigation";

/** New-account flow uses `/pages/welcome` first; keep URL for old links. */
export default function NewUserRedirect() {
  redirect("/pages/welcome");
}
