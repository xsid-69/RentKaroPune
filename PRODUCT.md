# RentkaroPune

RentkaroPune is a Pune-first, tech-enabled rental marketplace for flats, villas, and bungalows. It replaces opaque high-brokerage discovery with verified listings, low-cost contact unlocks, transparent token holds, and assigned broker partners.

## Audience
Families, bachelors, students, tourists, migrants, owners, and verified broker partners in Pune.

## Core flows
1. Owner pays ₹100, submits a listing, and waits for admin verification.
2. Admin verifies ownership documents and publishes the property.
3. Client browses free and pays ₹100 to unlock the assigned broker contact.
4. The first marketplace visit is free; every later visit costs ₹50.
5. After the broker marks the visit complete, the client may pay a 15% rent token.
6. Broker closes the deal; one month’s rent is the brokerage baseline, loyalty discount applies, then the collected brokerage splits 60% broker / 40% platform.

## Product decisions for this prototype
- Contact unlock is ₹100 and reveals the assigned verified broker.
- The first marketplace visit is free; every later visit costs ₹50 and is recorded in the ledger.
- Token is fixed at 15% of monthly rent; cancellation returns 75% and records the remaining 25% as a platform charge.
- Token is represented as a hold and is not included in platform revenue until cancellation or closure.
- Baseline brokerage is one month’s rent and is client-funded.
- Loyalty discounts are 10% on booking 1, 20% on booking 2, and 30% from booking 3 onward.
- Owner listing fee applies from listing one.
- Broker payout is calculated on closure.

## Register
Product UI with a conversion-led discovery surface and operational multi-role dashboard.
