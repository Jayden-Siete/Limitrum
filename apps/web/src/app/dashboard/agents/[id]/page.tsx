import { AgentDetailClient } from "./AgentDetailClient";

export function generateStaticParams() {
  return [
    { id: "agent_demo_001" },
    { id: "agent_demo_002" },
    { id: "agent_sales_01" },
    { id: "agent_support_01" },
  ];
}

export default function AgentDetailPage() {
  return <AgentDetailClient />;
}