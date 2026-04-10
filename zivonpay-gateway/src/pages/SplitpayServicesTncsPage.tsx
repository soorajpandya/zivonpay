import PolicyPageLayout from "@/components/PolicyPageLayout";

const SplitpayServicesTncsPage = () => (
  <PolicyPageLayout title="SplitPay Services - Terms & Conditions" lastUpdated="January 1, 2025">
    <h2>Overview</h2>
    <p>SplitPay is ZivonPay's split settlement service that enables marketplaces and platform businesses to automatically split payment proceeds between multiple parties.</p>

    <h2>Service Terms</h2>
    <ul>
      <li>SplitPay is available for verified marketplace and aggregator merchants</li>
      <li>All sub-merchants (vendors) must complete KYC verification before receiving settlements</li>
      <li>Split rules must be configured before processing transactions</li>
      <li>ZivonPay reserves the right to hold settlements for compliance review</li>
    </ul>

    <h2>Settlement Rules</h2>
    <p>Split settlements are processed based on pre-configured rules. Merchants can define percentage-based or fixed-amount splits. Platform commissions are deducted before vendor settlement.</p>

    <h2>Compliance</h2>
    <ul>
      <li>Marketplace merchants must comply with RBI PA/PG guidelines</li>
      <li>Sub-merchant KYC is mandatory as per RBI regulations</li>
      <li>ZivonPay maintains an escrow account for split settlement processing</li>
      <li>All settlements are subject to applicable tax deductions</li>
    </ul>

    <h2>Liability</h2>
    <p>The marketplace merchant is responsible for the accuracy of split rules and vendor information. ZivonPay is not liable for incorrect settlements arising from merchant-configured split rules.</p>
  </PolicyPageLayout>
);

export default SplitpayServicesTncsPage;
