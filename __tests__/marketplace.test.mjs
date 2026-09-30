import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { seedProperties } from "../lib/seed.js";
import { PLANS_CONFIG } from "../lib/plans-config.js";
import { canManageListings, isTrustedMutationRequest, validateImageDescriptors } from "../lib/server/cloudinary.js";
import { rateLimit, clientIp } from "../lib/server/rate-limit.js";

describe("RentKaro Pune - Marketplace Business Logic & Data Tests", () => {
  it("should have valid seed properties with owner and broker coverage", () => {
    assert.ok(Array.isArray(seedProperties) && seedProperties.length >= 10, "Should have at least 10 seed properties");
    
    const ownerListings = seedProperties.filter((p) => p.listedBy === "owner" && p.isOwner);
    const brokerListings = seedProperties.filter((p) => p.listedBy === "broker" && !p.isOwner);

    assert.ok(ownerListings.length >= 6, "Must have at least 6 direct owner listings");
    assert.ok(brokerListings.length >= 2, "Must have at least 2 broker listings");

    // All owner listings must have 0% brokerage
    ownerListings.forEach((p) => {
      assert.match(p.brokerage, /0%|Zero Brokerage/i, `Owner property ${p.id} must offer Zero Brokerage`);
      assert.ok(p.owner, `Owner property ${p.id} must have owner name`);
      assert.ok(p.contactPhone, `Owner property ${p.id} must have contact phone`);
    });

    // All broker listings must disclose brokerage
    brokerListings.forEach((p) => {
      assert.ok(p.brokerage && !p.brokerage.includes("0%"), `Broker property ${p.id} must disclose brokerage`);
    });
  });

  it("should include central inner-city Pune real estate", () => {
    const innerLocalities = ["Shivaji Nagar", "Deccan Gymkhana", "Camp", "Erandwane", "Kalyani Nagar"];
    innerLocalities.forEach((loc) => {
      const found = seedProperties.some((p) => p.locality === loc || p.location === loc);
      assert.ok(found, `Must have inner-city properties in ${loc}`);
    });
  });

  it("should have correct business model plans and pricing tiers", () => {
    assert.ok(PLANS_CONFIG.payPerListing.length >= 3, "Must have at least 3 pay-per-listing tiers");
    assert.ok(PLANS_CONFIG.monthlyPlans.length >= 3, "Must have at least 3 monthly landlord plans");

    // Verify 7-day free listing
    const freePlan = PLANS_CONFIG.payPerListing.find((p) => p.id === "free_7_day");
    assert.strictEqual(freePlan.price, 0, "Basic listing must be ₹0 free");

    // Verify 30-day listing extension
    const extensionPlan = PLANS_CONFIG.payPerListing.find((p) => p.id === "ad_extension_30");
    assert.strictEqual(extensionPlan.price, 149, "30-Day extension must be ₹149");

    // Verify verified badge
    const badgePlan = PLANS_CONFIG.payPerListing.find((p) => p.id === "verified_badge");
    assert.strictEqual(badgePlan.price, 299, "Verified badge must be ₹299");

    // Verify monthly landlord packages
    const starter = PLANS_CONFIG.monthlyPlans.find((p) => p.id === "starter_owner");
    assert.strictEqual(starter.price, 499);
    assert.strictEqual(starter.leads, 15);

    const pro = PLANS_CONFIG.monthlyPlans.find((p) => p.id === "pro_landlord");
    assert.strictEqual(pro.price, 999);
    assert.strictEqual(pro.leads, 40);

    const enterprise = PLANS_CONFIG.monthlyPlans.find((p) => p.id === "enterprise_developer");
    assert.strictEqual(enterprise.price, 1999);
  });
});

describe("RentKaro Pune - Security & System Design Tests", () => {
  it("should enforce authorization on property management", () => {
    assert.strictEqual(canManageListings({ admin: 1 }), true, "Admin should manage listings");
    assert.strictEqual(canManageListings({ role: "owner" }), true, "Owner role should manage listings");
    assert.strictEqual(canManageListings({ role: "broker" }), true, "Broker role should manage listings");
    assert.strictEqual(canManageListings({ role: "client" }), true, "Client role should manage listings");
    assert.strictEqual(canManageListings({ role: "unauthorized" }), false, "Unknown role must be rejected");
    assert.strictEqual(canManageListings(null), false, "Null user must be rejected");
  });

  it("should validate image descriptors against malicious or oversized uploads", () => {
    const validImages = [
      { name: "living_room.jpg", type: "image/jpeg", size: 1024 * 500 },
      { name: "bedroom.png", type: "image/png", size: 1024 * 700 }
    ];
    assert.strictEqual(validateImageDescriptors(validImages), "");

    // Oversized (> 8MB)
    const oversized = [{ name: "big.jpg", type: "image/jpeg", size: 10 * 1024 * 1024 }];
    assert.match(validateImageDescriptors(oversized), /smaller than 8 MB/i);

    // Invalid extension/mime
    const malicious = [{ name: "script.exe", type: "application/x-msdownload", size: 1024 }];
    assert.match(validateImageDescriptors(malicious), /must be a JPG, PNG, or WebP/i);

    // Empty list
    assert.match(validateImageDescriptors([]), /Choose between 1 and 8 photos/i);
  });

  it("should enforce rate limiting and prevent brute-force attacks", () => {
    const testKey = `test-rate-limit-${Date.now()}`;
    // Limit = 3 requests per 10 seconds
    const r1 = rateLimit({ key: testKey, limit: 3, windowMs: 10_000 });
    const r2 = rateLimit({ key: testKey, limit: 3, windowMs: 10_000 });
    const r3 = rateLimit({ key: testKey, limit: 3, windowMs: 10_000 });
    const r4 = rateLimit({ key: testKey, limit: 3, windowMs: 10_000 });

    assert.strictEqual(r1.ok, true);
    assert.strictEqual(r2.ok, true);
    assert.strictEqual(r3.ok, true);
    assert.strictEqual(r4.ok, false, "4th request within limit of 3 must be blocked");
    assert.ok(r4.retryAfter > 0, "Must return retryAfter seconds");
  });

  it("should safely extract client IP behind reverse proxies and load balancers", () => {
    const mockProxyReq = {
      headers: new Headers([
        ["x-forwarded-for", "203.0.113.195, 70.41.3.18"],
      ]),
    };

    const ip = clientIp(mockProxyReq);
    assert.strictEqual(ip, "203.0.113.195", "Must extract client IP from leftmost x-forwarded-for");
  });

  it("should protect against cross-site mutation forgery", () => {
    const crossSiteReq = {
      headers: {
        get: (h) => (h === "sec-fetch-site" ? "cross-site" : null),
      },
      url: "https://rentkaropune.com/api/properties",
    };
    assert.strictEqual(isTrustedMutationRequest(crossSiteReq), false, "Must block cross-site mutation requests");

    const sameOriginReq = {
      headers: {
        get: (h) => (h === "sec-fetch-site" ? "same-origin" : h === "origin" ? "https://rentkaropune.com" : null),
      },
      url: "https://rentkaropune.com/api/properties",
    };
    assert.strictEqual(isTrustedMutationRequest(sameOriginReq), true, "Must allow same-origin requests");
  });
});
