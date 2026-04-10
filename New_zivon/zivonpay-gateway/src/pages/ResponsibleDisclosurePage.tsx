import PolicyPageLayout from "@/components/PolicyPageLayout";

const ResponsibleDisclosurePage = () => (
  <PolicyPageLayout title="Responsible Disclosure Policy" lastUpdated="January 1, 2025">
    <h2>Introduction</h2>
    <p>At ZivonPay, we take security seriously. We value the security community and encourage responsible disclosure of any security vulnerabilities found in our systems.</p>

    <h2>Scope</h2>
    <p>This policy covers all ZivonPay-owned web applications, APIs, mobile applications, and supporting infrastructure.</p>

    <h2>Guidelines</h2>
    <ul>
      <li>Do not access, modify, or delete data belonging to other users</li>
      <li>Do not perform denial-of-service attacks</li>
      <li>Do not engage in social engineering of ZivonPay employees</li>
      <li>Provide sufficient detail to reproduce the vulnerability</li>
      <li>Allow reasonable time for ZivonPay to fix the issue before disclosure</li>
    </ul>

    <h2>What We're Looking For</h2>
    <ul>
      <li>SQL injection, XSS, CSRF, and other injection vulnerabilities</li>
      <li>Authentication and authorization bypass</li>
      <li>Remote code execution</li>
      <li>Sensitive data exposure</li>
      <li>Business logic vulnerabilities in payment flows</li>
    </ul>

    <h2>Reporting</h2>
    <p>Report vulnerabilities to security@zivonpay.com with detailed steps to reproduce. Include screenshots and proof-of-concept where possible.</p>

    <h2>Recognition</h2>
    <p>Valid reports will be acknowledged and researchers may be featured in our Security Hall of Fame. ZivonPay does not offer monetary bounties at this time.</p>
  </PolicyPageLayout>
);

export default ResponsibleDisclosurePage;
