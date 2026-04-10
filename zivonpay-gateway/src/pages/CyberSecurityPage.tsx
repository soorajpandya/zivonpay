import PolicyPageLayout from "@/components/PolicyPageLayout";

const CyberSecurityPage = () => (
  <PolicyPageLayout title="Cyber Security" lastUpdated="January 1, 2025">
    <h2>Our Security Commitment</h2>
    <p>At ZivonPay, security is not just a feature — it's the foundation of everything we build. We employ multiple layers of security to protect merchant and customer data at every point in the payment lifecycle.</p>

    <h2>Certifications & Compliance</h2>
    <ul>
      <li>PCI DSS Level 1 certified — the highest level of payment security</li>
      <li>ISO 27001:2013 certified information security management</li>
      <li>SOC 2 Type II compliant for data security and availability</li>
      <li>RBI-compliant data localization and storage</li>
    </ul>

    <h2>Security Measures</h2>
    <ul>
      <li>End-to-end encryption (TLS 1.3) for all data in transit</li>
      <li>AES-256 encryption for data at rest</li>
      <li>Multi-factor authentication for merchant dashboard access</li>
      <li>Real-time fraud detection with AI/ML models</li>
      <li>Regular penetration testing by certified security firms</li>
      <li>24/7 Security Operations Center (SOC) monitoring</li>
    </ul>

    <h2>Incident Response</h2>
    <p>We maintain a comprehensive incident response plan with defined procedures for detection, containment, eradication, and recovery. All security incidents are reported to relevant authorities as per regulatory requirements.</p>
  </PolicyPageLayout>
);

export default CyberSecurityPage;
