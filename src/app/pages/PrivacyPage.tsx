export function PrivacyPage() {
  const sections = [
    { title: "Information we collect", body: "We collect information you provide directly to us when you create an account, make a purchase, or contact us. This includes name, email address, payment information, and any other information you choose to provide. We also collect information automatically when you use our services, including usage data, device information, and log data." },
    { title: "How we use your information", body: "We use the information we collect to provide, maintain, and improve our products and services; process transactions and send related information; send technical notices, updates, and support messages; respond to your comments and questions; and monitor and analyze trends and usage." },
    { title: "Information sharing", body: "We do not sell your personal information. We may share your information with third-party vendors and service providers who perform services on our behalf, such as payment processing, data analysis, email delivery, and hosting services. These parties are authorized to use your personal information only as necessary to provide these services to us." },
    { title: "Data security", body: "We take reasonable measures to help protect your personal information from loss, theft, misuse, and unauthorized access. We use industry-standard encryption to protect data in transit and at rest. However, no security system is impenetrable, and we cannot guarantee the security of our systems." },
    { title: "Data retention", body: "We retain personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy, unless a longer retention period is required by law. When you close your account, we will delete or anonymize your personal information within 90 days." },
    { title: "Your rights", body: "Depending on your location, you may have certain rights regarding your personal information, including the right to access, correct, or delete your personal data; the right to object to or restrict processing; and the right to data portability. To exercise these rights, please contact us at info@loopital.com." },
    { title: "Cookies", body: "We use cookies and similar tracking technologies to collect and use personal information about you. For information about our use of cookies, please see our Cookie Policy. You can control the use of cookies through your browser settings." },
    { title: "Changes to this policy", body: "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the effective date. We encourage you to review this policy periodically." },
    { title: "Contact us", body: "If you have questions about this Privacy Policy or our privacy practices, please contact us at: info@loopital.com · Loopital Limited, Pyale Hub, 21 Bekwere Wosu Street, D-Line, Diobu, Port Harcourt, Rivers State, Nigeria." },
  ];

  return (
    <div style={{ background: "#FFFFFF" }}>
      <section style={{ background: "#F7F7FB", padding: "80px 0 48px" }}>
        <div className="max-w-3xl mx-auto px-6">
          <p style={{ color: "#2563EB", fontSize: "13px", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "12px" }}>LEGAL</p>
          <h1 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, color: "#0D0D1A", letterSpacing: "-0.025em", marginBottom: "12px" }}>Privacy Policy</h1>
          <p style={{ color: "#9CA3AF", fontSize: "14px" }}>Effective date: June 9, 2026</p>
        </div>
      </section>
      <section style={{ padding: "64px 0 96px" }}>
        <div className="max-w-3xl mx-auto px-6 flex flex-col gap-10">
          <p style={{ color: "#6B7280", fontSize: "16px", lineHeight: 1.8 }}>
            Loopital Limited ("Loopital", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our products, services, and website.
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
