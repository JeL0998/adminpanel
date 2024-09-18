// src/pages/main.js
import Layout from "@/components/Layout";

export default function DashboardPage() {
    return (
    <Layout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <p>Welcome to the admin dashboard. Use the sidebar to navigate.</p>
        {/* Additional dashboard content goes here */}
      </div>
    </Layout>
    );
  }
