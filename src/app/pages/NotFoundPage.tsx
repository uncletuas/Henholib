import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center gap-6">
      <p style={{ fontSize: "120px", fontWeight: 800, color: "#EEF4FF", lineHeight: 1, letterSpacing: "-0.05em" }}>404</p>
      <div style={{ marginTop: "-40px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#0D0D1A", letterSpacing: "-0.02em", marginBottom: "10px" }}>Page not found</h1>
        <p style={{ color: "#6B7280", fontSize: "16px" }}>The page you're looking for doesn't exist or has been moved.</p>
      </div>
      <div className="flex gap-3">
        <Link to="/" className="px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90" style={{ background: "#2563EB", color: "#fff" }}>
          Go home
        </Link>
        <Link to="/contact" className="px-6 py-3 rounded-xl font-medium text-sm transition-all hover:bg-gray-50" style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#374151" }}>
          Contact support
        </Link>
      </div>
    </div>
  );
}
