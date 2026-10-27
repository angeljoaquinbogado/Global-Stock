import { randomUUID } from "node:crypto";

const PAYPAL_API = "https://api-m.sandbox.paypal.com";
const DEMO_AMOUNT = "19.99";
const DEMO_CURRENCY = "USD";
const DEMO_CUSTOM_ID = "global-stock-hackathon-demo-v1";

type PayPalLink = { rel?: string; href?: string };
type PayPalOrder = {
  id?: string;
  status?: string;
  links?: PayPalLink[];
  purchase_units?: Array<{
    custom_id?: string;
    amount?: { currency_code?: string; value?: string };
  }>;
};

function credentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

async function accessToken() {
  const auth = credentials();
  if (!auth) throw new Error("PAYPAL_SANDBOX_NOT_CONFIGURED");
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${auth.clientId}:${auth.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error("PAYPAL_SANDBOX_AUTH_FAILED");
  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error("PAYPAL_SANDBOX_AUTH_FAILED");
  return data.access_token;
}

/** Fixed-price sandbox-only checkout. Never accepts an amount from the browser. */
export async function createSandboxDemoOrder() {
  const token = await accessToken();
  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": randomUUID()
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: "global-stock-demo-item",
        custom_id: DEMO_CUSTOM_ID,
        description: "Global Stock — pedido de prueba del hackathon",
        amount: {
          currency_code: DEMO_CURRENCY,
          value: DEMO_AMOUNT,
          breakdown: {
            item_total: { currency_code: DEMO_CURRENCY, value: DEMO_AMOUNT }
          }
        },
        items: [{
          name: "Producto de prueba de tienda online",
          description: "Artículo ficticio para demostrar el checkout Sandbox",
          quantity: "1",
          unit_amount: { currency_code: DEMO_CURRENCY, value: DEMO_AMOUNT },
          category: "PHYSICAL_GOODS"
        }]
      }],
      application_context: {
        brand_name: "Global Stock Demo",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
        return_url: `${process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000"}/hackathon-demo?paypal=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000"}/hackathon-demo?paypal=cancelled`
      }
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error("PAYPAL_SANDBOX_ORDER_FAILED");
  const order = await response.json() as PayPalOrder;
  const approvalUrl = order.links?.find((link) => link.rel === "approve")?.href;
  if (!order.id || !approvalUrl || !approvalUrl.startsWith("https://www.sandbox.paypal.com/")) {
    throw new Error("PAYPAL_SANDBOX_ORDER_INVALID");
  }
  return { id: order.id, approvalUrl, amount: DEMO_AMOUNT, currency: DEMO_CURRENCY };
}

export async function captureSandboxDemoOrder(orderId: string) {
  if (!/^[A-Z0-9-]{8,80}$/i.test(orderId)) throw new Error("PAYPAL_ORDER_ID_INVALID");
  const token = await accessToken();
  const inspect = await fetch(`${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(12000)
  });
  if (!inspect.ok) throw new Error("PAYPAL_SANDBOX_ORDER_NOT_FOUND");
  const order = await inspect.json() as PayPalOrder;
  const unit = order.purchase_units?.[0];
  if (unit?.custom_id !== DEMO_CUSTOM_ID ||
      unit.amount?.currency_code !== DEMO_CURRENCY ||
      unit.amount?.value !== DEMO_AMOUNT) {
    throw new Error("PAYPAL_SANDBOX_ORDER_NOT_OURS");
  }
  if (order.status === "COMPLETED") {
    return { id: order.id || orderId, status: "COMPLETED", currency: DEMO_CURRENCY, amount: DEMO_AMOUNT };
  }
  if (order.status !== "APPROVED") throw new Error("PAYPAL_SANDBOX_ORDER_NOT_APPROVED");
  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `global-stock-demo-capture-${orderId}`
    },
    body: "{}",
    cache: "no-store",
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error("PAYPAL_SANDBOX_CAPTURE_FAILED");
  const captured = await response.json() as PayPalOrder;
  if (captured.status !== "COMPLETED") throw new Error("PAYPAL_SANDBOX_CAPTURE_INCOMPLETE");
  return { id: captured.id || orderId, status: "COMPLETED", currency: DEMO_CURRENCY, amount: DEMO_AMOUNT };
}

export function paypalSandboxConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID?.trim() && process.env.PAYPAL_CLIENT_SECRET?.trim());
}
