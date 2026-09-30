# RentkaroPune

RentkaroPune is a Pune-first rental listing marketplace for verified flats, villas, bungalows, and commercial properties. It operates as **India's Transparent Property Marketplace**: owners list free with zero brokerage, brokers list with upfront fee disclosure, and RentKaro monetizes low-friction access and verified badges rather than transaction brokerage.

## Audience
- Renters browsing approved Pune homes (filtered by Direct Owner or Broker Listed)
- Property owners listing rental units directly with 0% brokerage
- Real estate brokers and consultants listing inventory with disclosed terms
- Commercial landlords managing multi-property portfolios and lead packages
- Admins verifying inventory, badges, and responding to enquiries

## Business Model: "Pay for Access, Not Brokerage"

### 1. Free 7-Day Property Listing
- Both **Owners** and **Brokers** can list properties on the platform.
- Basic listing submission is **₹0 (100% Free)**.
- Free ad runs active in search results for **7 days**.
- After 7 days, the poster can extend the ad for 30 days (₹149) or upgrade to an Owner Monthly Plan.

### 2. Two Distinct Property Types for Customers
- **🟢 Direct Owner Listed (Zero Brokerage)**:
  - 100% Zero Brokerage guarantee for tenants.
  - Direct connection with the verified property owner.
  - Low-friction contact unlock (₹49) reveals direct phone, WhatsApp link, and full address.
- **🟠 Broker Listed (Brokerage Disclosed Upfront)**:
  - Clearly marked with an amber "Broker Listed" tag.
  - Prominent brokerage warning banner and interactive advisory modal.
  - Informs renters about expected broker commission (15–30 days rent) prior to unlocking (₹99).
  - Brokerage is negotiated directly with the broker; RentKaro Pune never charges transaction commissions.

### 3. Three-Tier Search Ranking
1. **⭐ Verified / Premium Listings (TOP)**:
   - Verified Owner/Broker badge with shield icon.
   - Guaranteed top search placement across Pune localities.
   - 3x higher view and lead conversion.
2. **Active Paid / Extended Listings**:
   - Properties renewed after the 7-day free trial.
   - Standard active ranking.
3. **Free Listings (BELOW)**:
   - Free 7-day trial listings.
   - Lower visibility below verified and active paid listings.

### 4. Low-Friction Contact Unlock
- Replaces heavy, prohibitive brokerage with affordable, transparent access:
  - **Owner Listing Unlock**: ₹49 (One-time, direct owner access).
  - **Broker Listing Unlock**: ₹99 (One-time, broker coordination + advisory notice).
- Transparent unlock modal with instant UPI and card simulation, immediately revealing direct mobile number, society name, and WhatsApp button.
- Unlocked state persisted per user/device and logged server-side.

### 5. Commercial & Landlord Monthly Lead Plans
- For regular landlords, property developers, and commercial shop owners:
  - **Starter Owner (₹499/mo)**: 15 Direct Tenant Leads, 2 Featured Verified Badges, up to 3 active listings.
  - **Pro Landlord & Commercial (₹999/mo)**: 40 Direct Tenant Leads, 5 Featured Verified Badges, up to 10 active listings, priority placement.
  - **Commercial & Enterprise (₹1,999/mo)**: Unlimited Leads, Verified Badges on all listings (Rank 1 Priority), dedicated account manager.

## Security and Privacy
- Strict Content Security Policy, rate-limiting on unlock and plan endpoints.
- Server-side Admin SDK isolation for unlocked lead logs and plan subscriptions.
- Masked phone numbers and blurred addresses until securely unlocked by authenticated/verified users.