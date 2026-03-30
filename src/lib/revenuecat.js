import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { RevenueCatUI } from '@revenuecat/purchases-capacitor-ui';

// ─── Constants ────────────────────────────────────────────────────────────────
export const RC_API_KEY = 'test_RCwOhZZVauPLKpgZmfTVAvqgRRw';
export const ENTITLEMENT_ID = 'Courtly Pro';

// True only when running inside a Capacitor native build (iOS / Android).
// False in the browser / Vite dev server.
export const isNative = Capacitor.isNativePlatform();

// Guard against calling configure() more than once per app session.
let configured = false;

// ─── Initialization ───────────────────────────────────────────────────────────

/**
 * Configure the RevenueCat SDK and log in the current user.
 * Call this once after authentication. Safe to call again on user change
 * — subsequent calls skip configure() and only call logIn().
 */
export async function configureRevenueCat(userId) {
  if (!isNative) return;

  if (!configured) {
    if (import.meta.env.DEV) {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    }
    await Purchases.configure({ apiKey: RC_API_KEY });
    configured = true;
  }

  if (userId) {
    await Purchases.logIn({ appUserID: userId });
  }
}

/**
 * Log out the current RevenueCat user.
 * Call on sign-out so the next anonymous session starts fresh.
 */
export async function rcLogOut() {
  if (!isNative || !configured) return;
  try {
    await Purchases.logOut();
  } catch (err) {
    // logOut throws if the user is already anonymous — safe to ignore.
    console.warn('[RC] logOut:', err?.message);
  }
}

// ─── Customer Info ────────────────────────────────────────────────────────────

/** Fetch the latest CustomerInfo object from RevenueCat. */
export async function getCustomerInfo() {
  if (!isNative) return null;
  const { customerInfo } = await Purchases.getCustomerInfo();
  return customerInfo;
}

/**
 * Returns true when the CustomerInfo contains an active "Courtly Pro" entitlement.
 * Treats null/undefined customerInfo as not subscribed.
 */
export function hasProAccess(customerInfo) {
  return customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
}

// ─── Offerings ────────────────────────────────────────────────────────────────

/**
 * Fetch the current Offerings object from RevenueCat.
 * Contains packages for Monthly, Yearly, and Lifetime products.
 */
export async function getOfferings() {
  if (!isNative) return null;
  const { offerings } = await Purchases.getOfferings();
  return offerings;
}

// ─── Purchases ────────────────────────────────────────────────────────────────

/**
 * Purchase a specific Package (e.g. from offerings.current.availablePackages).
 * Throws on network/billing errors. Returns null when the user cancels.
 */
export async function purchasePackage(pkg) {
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
  return customerInfo;
}

/**
 * Restore any previous purchases for the current Apple/Google account.
 * Updates CustomerInfo with any re-activated entitlements.
 */
export async function restorePurchases() {
  const { customerInfo } = await Purchases.restorePurchases();
  return customerInfo;
}

// ─── Paywalls ─────────────────────────────────────────────────────────────────

/**
 * Present the RevenueCat native paywall.
 * Optionally pass an Offering to show a specific one; defaults to current offering.
 * Returns the PAYWALL_RESULT string: PURCHASED | RESTORED | CANCELLED | ERROR | NOT_PRESENTED
 */
export async function presentPaywall(offering) {
  if (!isNative) return 'NOT_NATIVE';
  const opts = offering ? { offering } : {};
  const { result } = await RevenueCatUI.presentPaywall(opts);
  return result;
}

/**
 * Present the paywall only when the user does NOT yet have the "Courtly Pro"
 * entitlement. Skips presentation (returns NOT_PRESENTED) if already subscribed.
 */
export async function presentPaywallIfNeeded(offering) {
  if (!isNative) return 'NOT_NATIVE';
  const opts = {
    requiredEntitlementIdentifier: ENTITLEMENT_ID,
    ...(offering ? { offering } : {}),
  };
  const { result } = await RevenueCatUI.presentPaywallIfNeeded(opts);
  return result;
}

// ─── Customer Center ──────────────────────────────────────────────────────────

/**
 * Present the RevenueCat Customer Center — a self-service UI that lets users
 * cancel, restore, request refunds, and manage their subscription.
 * Requires a RevenueCat Pro/Enterprise plan to be configured in the dashboard.
 */
export async function presentCustomerCenter() {
  if (!isNative) return;
  await RevenueCatUI.presentCustomerCenter();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true for errors caused by the user explicitly dismissing a purchase
 * dialog. These should be treated as non-errors (no toast/alert needed).
 */
export function isUserCancelledError(err) {
  const msg = (err?.message || '').toLowerCase();
  const code = String(err?.code ?? err?.userInfo?.readableErrorCode ?? '');
  return (
    msg.includes('user_cancelled') ||
    msg.includes('user cancel') ||
    msg.includes('cancelled') ||
    code === 'USER_CANCELLED' ||
    code === '2'
  );
}
