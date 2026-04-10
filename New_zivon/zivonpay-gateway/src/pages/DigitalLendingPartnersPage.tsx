import PolicyPageLayout from "@/components/PolicyPageLayout";

const DigitalLendingPartnersPage = () => (
  <PolicyPageLayout title="Digital Lending Partners" lastUpdated="January 1, 2025">
    <h2>Overview</h2>
    <p>ZivonPay partners with regulated lending institutions to offer digital lending products including EMI, Buy Now Pay Later, and cardless credit options to customers at checkout.</p>

    <h2>Our Lending Partners</h2>
    <ul>
      <li>HDFC Bank — Credit card and debit card EMI</li>
      <li>ICICI Bank — EMI, Pay Later options</li>
      <li>Axis Bank — EMI on debit and credit cards</li>
      <li>Kotak Mahindra Bank — Instant EMI</li>
      <li>State Bank of India — SBI Card EMI</li>
      <li>LazyPay (ZivonPay Finance) — Buy Now Pay Later</li>
      <li>Simpl — Pay in 3 installments</li>
      <li>ZestMoney — Cardless EMI</li>
    </ul>

    <h2>Regulatory Compliance</h2>
    <p>All lending partners are regulated by the Reserve Bank of India (RBI) or operate under valid NBFC licenses. ZivonPay acts as a technology service provider and does not engage in lending activities directly.</p>

    <h2>Customer Protection</h2>
    <ul>
      <li>All lending terms are clearly disclosed to customers before transaction</li>
      <li>Interest rates and fees are set by the lending partners</li>
      <li>Customer data is shared with lending partners only with explicit consent</li>
      <li>Grievance redressal mechanisms are available through lending partners</li>
    </ul>
  </PolicyPageLayout>
);

export default DigitalLendingPartnersPage;
