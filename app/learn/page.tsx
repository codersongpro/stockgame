import { redirect } from "next/navigation";

export default function LearnPage() {
  redirect("/setup?level=elementary_low");
}
