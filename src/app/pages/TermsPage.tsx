export function TermsPage() {
  const sections = [
    { title: "Acceptance of terms", body: "By accessing or using any Loopital product or service, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our products or services." },
    { title: "Use of our services", body: "You may use our services only as permitted by law and in accordance with these terms. You may not use our services in any way that could harm, disable, overburden, or impair our servers or networks, or interfere with any other party's use of our services." },
    { title: "Account registration", body: "To access certain features, you must register for an account. You agree to provide accurate, current, and complete information and to keep this information updated. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account." },
    { title: "Subscriptions and billing", body: "Certain services are offered on a subscription basis. By subscribing, you agree to pay the fees described at the time of purchase. Subscriptions auto-renew unless cancelled before the renewal date. You can manage and cancel subscriptions from your account dashboard." },
    { title: "Intellectual property", body: "All content, software, and technology in our products is owned by Loopital Limited or its licensors and is protected by intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use our products for your internal business purposes." },
    { title: "Prohibited activities", body: "You may not: reverse engineer or attempt to extract source code from our software; resell or sublicense our services without authorization; use our services to develop competing products; or use our services for any unlawful purpose." },
    { title: "Termination", body: "We may suspend or terminate your access to our services at any time for violation of these terms or for any other reason at our discretion. Upon termination, your right to use our services will cease immediately." },
    { title: "Limitation of liability", body: "To the maximum extent permitted by law, Loopital shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, or goodwill." },
    { title: "Governing law", body: "These terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in the courts of Rivers State, Nigeria." },
    { title: "Contact", body: "Questions about these terms should be directed to: info@loopital.com · Loopital Limited, registered in Nigeria." },
  ];

  return (
    <div style={{ background: "#FFFFFF" }}>
      <section style={{ background: "#F7F7FB", padding: "80px 0 48px" }}>
        <div className="max-w-3xl mx-auto px-6">
          <p style={{ color: "#2563EB", fontSize: "13px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "12px" }}>LEGAL</p>
          <h1 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.025em", marginBottom: "12px" }}>Terms of Service</h1>
          <p style={{ color: "#9CA3AF", fontSize: "14px" }}>Effective date: June 9, 2026</p>
        </div>
      </section>
      <section style={{ padding: "64px 0 96px" }}>
        <div className="max-w-3xl mx-auto px-6 flex flex-col gap-10">
          <p style={{ color: "#6B7280", fontSize: "16px", lineHeight: 1.8 }}>
            These Terms of Service govern your use of all products, services, and websites operated by Loopital Limited. Please read them carefully before using our services.
          </p>
          {sections.map((s) => (
            <div key={s.title}>
              <h2 style={{ fontWeight: 700, fontSize: "18px", color: "#0D0D1A", marginBottom: "10px" }}>{s.title}</h2>
              <p style={{ color: "#6B7280", fontSize: "15px", lineHeight: 1.8 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
