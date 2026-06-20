import { redirect } from "next/navigation";

export default function LearningMissionPage() {
  redirect("/setup?level=elementary_low");
}
