import PolicyPageLayout from "@/components/PolicyPageLayout";

const OnlinePaTncsPage = () => (
  <PolicyPageLayout title="Online Payment Aggregator - Terms & Conditions" lastUpdated="January 1, 2025">
    <h2>Definitions</h2>
    <p>In these Terms and Conditions, "ZivonPay" refers to ZivonPay Payments Private Limited, "Merchant" refers to any business entity using ZivonPay's payment aggregation services, and "Customer" refers to the end-user making a payment.</p>

    <h2>Service Description</h2>
    <p>ZivonPay provides online payment aggregation services enabling merchants to accept digital payments through various payment instruments including credit cards, debit cards, UPI, net banking, wallets, and other modes.</p>

    <h2>Merchant Obligations</h2>
    <ul>
      <li>Provide accurate business information and maintain valid KYC documentation</li>
      <li>Comply with all applicable laws, regulations, and card network rules</li>
      <li>Not process transactions for prohibited or restricted business categories</li>
      <li>Maintain adequate customer support and dispute resolution mechanisms</li>
      <li>Implement reasonable security measures on their platform</li>
    </ul>

    <h2>Payment Processing</h2>
    <p>ZivonPay processes payments as an intermediary between the merchant and the acquiring bank. ZivonPay does not guarantee the success of any transaction and is not liable for bank-side failures or customer disputes.</p>

    <h2>Fees & Charges</h2>
    <p>Transaction fees are as per the agreed pricing plan. ZivonPay reserves the right to modify fees with prior notice. All fees are exclusive of applicable taxes.</p>

    <h2>Limitation of Liability</h2>
    <p>ZivonPay's liability is limited to the transaction processing fees collected. ZivonPay is not liable for indirect, consequential, or punitive damages arising from the use of its services.</p>
  </PolicyPageLayout>
);

export default OnlinePaTncsPage;
