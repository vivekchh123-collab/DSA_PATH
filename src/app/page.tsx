import Dashboard, { type Problem } from "@/components/Dashboard";
import problems from "@/data/problems.json";

export default function Home() {
  return <Dashboard problems={problems as Problem[]} />;
}
