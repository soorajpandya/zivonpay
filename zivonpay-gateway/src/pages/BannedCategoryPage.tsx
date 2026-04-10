import PolicyPageLayout from "@/components/PolicyPageLayout";

const BannedCategoryPage = () => (
  <PolicyPageLayout title="Banned & Restricted Category List" lastUpdated="January 1, 2025">
    <h2>Overview</h2>
    <p>ZivonPay prohibits or restricts the use of its payment services for certain business categories as mandated by regulatory authorities, card networks, and internal risk policies.</p>

    <h2>Banned Categories</h2>
    <p>The following categories are strictly prohibited from using ZivonPay services:</p>
    <ul>
      <li>Illegal drugs, narcotics, and controlled substances</li>
      <li>Weapons, ammunition, and explosive materials</li>
      <li>Counterfeit goods and intellectual property violations</li>
      <li>Ponzi schemes, pyramid schemes, and fraudulent investments</li>
      <li>Online gambling (except where legally licensed)</li>
      <li>Adult content and services (except where legally permitted)</li>
      <li>Money laundering and terrorist financing activities</li>
      <li>Cryptocurrency trading platforms (unless regulated)</li>
    </ul>

    <h2>Restricted Categories</h2>
    <p>The following categories require additional documentation and approval:</p>
    <ul>
      <li>Pharmaceuticals and healthcare products</li>
      <li>Travel and ticketing services</li>
      <li>Real estate and property transactions</li>
      <li>Financial services and lending</li>
      <li>Precious metals and gemstones</li>
      <li>Tobacco and related products</li>
    </ul>

    <h2>Compliance</h2>
    <p>Merchants found operating in banned categories will have their accounts immediately terminated. Merchants in restricted categories must obtain prior approval from ZivonPay's compliance team.</p>
  </PolicyPageLayout>
);

export default BannedCategoryPage;
