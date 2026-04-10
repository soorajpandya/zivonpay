import PolicyPageLayout from "@/components/PolicyPageLayout";

const ZivonpayPoliciesPage = () => (
  <PolicyPageLayout title="ZivonPay Policies" lastUpdated="July 18, 2024">
    <h2>1. General Terms</h2>
    <p>
      These policies ("ZivonPay Policies") govern the use of ZivonPay Private Limited's ("ZivonPay", "we", "our", "us") payment processing, payment aggregation, and related services. By accessing or using ZivonPay's services, platforms, websites, applications, or APIs, you agree to be bound by these policies and any amendments made from time to time. ZivonPay reserves the right to update these policies at its sole discretion, and the most current version will always be available on this page.
    </p>

    <h2>2. Merchant Eligibility &amp; Onboarding</h2>
    <p>To use ZivonPay's services, merchants must satisfy the following eligibility criteria:</p>
    <ul>
      <li>Must be a registered business entity or individual with valid business registration documents in India or applicable jurisdiction</li>
      <li>Must provide complete Know Your Customer (KYC) documentation including PAN, GST registration (if applicable), valid address proof, identity proof, and bank account details</li>
      <li>Must not be engaged in any business activity listed under ZivonPay's Banned Category Policy</li>
      <li>Must maintain a valid and operational website or application displaying accurate business information, refund/cancellation policy, privacy policy, and terms of service</li>
      <li>Must comply with all applicable laws and regulations in the jurisdictions where they operate</li>
    </ul>
    <p>
      ZivonPay reserves the right to verify merchant identity, business legitimacy, and compliance status before, during, and after activation. ZivonPay may, at its sole discretion, refuse, suspend, or terminate merchant accounts that fail to meet eligibility requirements.
    </p>

    <h2>3. Accepted Payment Methods</h2>
    <p>ZivonPay supports a wide range of payment methods including but not limited to:</p>
    <ul>
      <li><strong>UPI:</strong> All UPI-enabled applications and handles</li>
      <li><strong>Cards:</strong> Visa, Mastercard, American Express, Diners Club, and RuPay credit and debit cards</li>
      <li><strong>Net Banking:</strong> All major Indian banks</li>
      <li><strong>Wallets:</strong> Popular digital wallets as supported by ZivonPay</li>
      <li><strong>EMI:</strong> Credit card EMI, debit card EMI, and cardless EMI options</li>
      <li><strong>Buy Now Pay Later (BNPL):</strong> Through authorized BNPL partners</li>
      <li><strong>QR Codes:</strong> Static and dynamic QR code payments including Bharat QR</li>
      <li><strong>International Payments:</strong> International card payments and select international payment methods</li>
    </ul>
    <p>Availability of payment methods may vary based on merchant category, risk assessment, and regulatory requirements.</p>

    <h2>4. Transaction Policies</h2>
    <h3>4.1. Transaction Processing</h3>
    <ul>
      <li>All transactions processed through ZivonPay are subject to real-time fraud screening, risk assessment, and compliance checks</li>
      <li>ZivonPay processes transactions in Indian Rupees (INR) for domestic transactions and in supported foreign currencies for international transactions</li>
      <li>Minimum and maximum transaction limits may apply based on payment method, merchant category, and risk profile</li>
      <li>ZivonPay does not guarantee 100% transaction success rates as transactions depend on multiple parties including issuing banks, card networks, and payment method providers</li>
    </ul>

    <h3>4.2. Transaction Monitoring &amp; Risk Management</h3>
    <ul>
      <li>ZivonPay employs advanced fraud detection and risk management systems to monitor transactions in real-time</li>
      <li>ZivonPay may hold, delay, decline, or reverse transactions suspected of fraud, policy violations, or regulatory non-compliance</li>
      <li>Merchants are responsible for ensuring their products and services comply with all applicable laws, regulations, and card network rules</li>
      <li>ZivonPay may request additional information or documentation from merchants for transaction verification</li>
      <li>Repeated instances of fraud, chargebacks, or policy violations may result in account suspension or termination</li>
    </ul>

    <h3>4.3. Chargebacks &amp; Disputes</h3>
    <ul>
      <li>Chargebacks and payment disputes are handled in accordance with card network rules (Visa, Mastercard, etc.) and banking regulations</li>
      <li>Merchants are notified of chargebacks via the ZivonPay dashboard and/or email and must respond within the stipulated timeline</li>
      <li>Merchants are required to provide supporting documentation to contest chargebacks</li>
      <li>ZivonPay may debit the chargeback amount from the merchant's settlement or security deposit</li>
      <li>Excessive chargeback rates may result in additional fees, reserves, or account termination</li>
    </ul>

    <h2>5. Settlement Policy</h2>
    <h3>5.1. Standard Settlements</h3>
    <ul>
      <li>Standard settlements are processed on a T+1 (next business day) basis for domestic transactions</li>
      <li>Settlement timelines may vary based on public holidays, bank processing times, weekends, and force majeure events</li>
      <li>Settlements are credited to the registered bank account provided during onboarding</li>
      <li>Merchants can view settlement details, transaction breakdowns, and reports on the ZivonPay dashboard</li>
    </ul>

    <h3>5.2. Priority &amp; Instant Settlements</h3>
    <ul>
      <li>Priority settlements (T+0 or same-day) and instant settlements are available at additional charges</li>
      <li>Eligibility for priority and instant settlements is subject to ZivonPay's risk assessment and approval</li>
      <li>Additional terms and conditions may apply for priority and instant settlement services</li>
    </ul>

    <h3>5.3. Settlement Holds &amp; Deductions</h3>
    <ul>
      <li>ZivonPay reserves the right to hold settlements in cases of suspected fraud, excessive chargebacks, regulatory requirements, or policy violations</li>
      <li>Transaction fees, chargeback amounts, penalties, and any other applicable charges will be deducted from settlements</li>
      <li>ZivonPay may maintain a rolling reserve or security deposit as per the merchant agreement</li>
    </ul>

    <h2>6. Refund Policy</h2>
    <ul>
      <li>Merchants can initiate full or partial refunds through the ZivonPay dashboard or API within 180 days of the original transaction date</li>
      <li>Refunds are processed to the original payment source (card, bank account, wallet, UPI, etc.) within 5-7 business days</li>
      <li>Refund timelines may vary based on the issuing bank, payment method, and card network processing times</li>
      <li>Refund processing fees may be applicable as per the merchant agreement</li>
      <li>ZivonPay does not charge transaction fees on refunded amounts (subject to the terms of the merchant agreement)</li>
      <li>Merchants are responsible for maintaining a clear and transparent refund and cancellation policy on their website or application</li>
    </ul>

    <h2>7. Pricing &amp; Fees</h2>
    <ul>
      <li>ZivonPay's pricing is as per the merchant agreement and may include transaction fees (percentage-based and/or flat fee per transaction), setup fees, annual maintenance charges, and other applicable fees</li>
      <li>Fees are deducted from the settlement amount unless otherwise agreed</li>
      <li>ZivonPay reserves the right to revise pricing with prior notice to merchants</li>
      <li>GST and other applicable taxes will be charged in addition to the stated fees</li>
      <li>Detailed pricing information is available on the ZivonPay Pricing page and the merchant agreement</li>
    </ul>

    <h2>8. Data Protection &amp; Security</h2>
    <ul>
      <li>ZivonPay is PCI DSS Level 1 certified and adheres to the highest standards of payment data security</li>
      <li>All sensitive data is encrypted at rest and in transit using industry-standard encryption protocols</li>
      <li>ZivonPay complies with applicable data protection regulations including the Information Technology Act, 2000 and its rules</li>
      <li>ZivonPay does not store full card numbers, CVV, or PIN data on its systems in compliance with PCI DSS requirements</li>
      <li>Merchants must comply with PCI DSS requirements applicable to their integration type and must not store sensitive cardholder data</li>
      <li>For detailed information on how ZivonPay handles personal data, please refer to our <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a></li>
    </ul>

    <h2>9. Intellectual Property</h2>
    <p>
      All content, trademarks, logos, software, APIs, documentation, and materials provided by ZivonPay are the exclusive property of ZivonPay Private Limited. Merchants are granted a limited, non-exclusive, non-transferable license to use ZivonPay's branding and integration tools solely for the purpose of accepting payments through ZivonPay. Unauthorized use, reproduction, or distribution of ZivonPay's intellectual property is strictly prohibited.
    </p>

    <h2>10. Limitation of Liability</h2>
    <ul>
      <li>ZivonPay shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with the use of ZivonPay's services</li>
      <li>ZivonPay's total liability shall not exceed the total fees paid by the merchant to ZivonPay in the 12 months preceding the claim</li>
      <li>ZivonPay shall not be liable for any losses arising from circumstances beyond its reasonable control including but not limited to system failures of third-party banks, card networks, payment method providers, internet service providers, or force majeure events</li>
      <li>ZivonPay does not guarantee uninterrupted, error-free, or completely secure service, although we strive for 99.99% uptime</li>
    </ul>

    <h2>11. Termination</h2>
    <ul>
      <li>Either party may terminate the merchant agreement by providing written notice as per the terms of the agreement</li>
      <li>ZivonPay may immediately suspend or terminate a merchant account in cases of fraud, policy violations, regulatory non-compliance, excessive chargebacks, or legal requirements</li>
      <li>Upon termination, ZivonPay will settle any outstanding amounts after deducting applicable fees, chargebacks, penalties, and reserves</li>
      <li>Obligations regarding data protection, confidentiality, and intellectual property shall survive termination</li>
    </ul>

    <h2>12. Governing Law &amp; Dispute Resolution</h2>
    <p>
      These policies shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these policies shall be subject to the exclusive jurisdiction of the courts in New Delhi, India. The parties agree to first attempt to resolve any disputes through good-faith negotiation and, if necessary, through mediation before pursuing litigation.
    </p>

    <h2>13. Contact Us</h2>
    <p>
      For any queries, concerns, or complaints regarding these policies, please contact us at:
    </p>
    <ul>
      <li><strong>General Inquiries:</strong> support@zivonpay.com</li>
      <li><strong>Merchant Support:</strong> merchants@zivonpay.com</li>
      <li><strong>Compliance &amp; Grievance:</strong> grievance@zivonpay.com</li>
      <li><strong>Privacy Related:</strong> privacy@zivonpay.com</li>
    </ul>
  </PolicyPageLayout>
);

export default ZivonpayPoliciesPage;
