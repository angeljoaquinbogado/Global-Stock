# Global Stock — Production Launch Checklist

Operator: Angel Joaquin Bogado  
Location: Provincia de Buenos Aires, Argentina  
Support: angeljoaquinbogado@gmail.com  
Legal/privacy: joaquinbogado555@gmail.com

## Required before production launch

1. Deploy the latest main branch with HTTPS.
2. Set a strong GLOBAL_STOCK_CONNECTOR_SECRET (32+ random characters).
3. Configure Global Intelligence server-side:
   - OPENAI_API_KEY
   - OPENAI_MODEL
4. Decide whether production accounts will use Supabase Auth.
   If yes, configure:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
5. Verify /legal, /legal/privacy, /legal/terms, /legal/security, /about, /support and /download.
6. Test PWA installation on iPhone/iPad, Android, Windows and desktop browsers.
7. Test verified ecommerce flow:
   - Public URL detection must not grant write access.
   - Owner authorization must succeed before private catalog sync.
   - Real catalog import must replace demo inventory.
   - Editing stock/price in Global Stock must be reflected by the authorized store.
   - Revoking the token on the store must invalidate the Global Stock session.
8. Keep native store URLs blank until each listing is actually approved.
   Once published, set:
   - NEXT_PUBLIC_APP_STORE_URL
   - NEXT_PUBLIC_PLAY_STORE_URL
   - NEXT_PUBLIC_MICROSOFT_STORE_URL
   - NEXT_PUBLIC_APP_GALLERY_URL
   - NEXT_PUBLIC_GALAXY_STORE_URL

## Ecommerce provider apps

The product UI documents the intended authorization method for:
- Shopify — OAuth
- Tiendanube — OAuth
- WooCommerce — REST API credentials/authorization
- Mercado Libre — OAuth
- Custom ecommerce — scoped Global Stock token

Provider app credentials must remain server-side. Never commit them or expose them through NEXT_PUBLIC_*.

## Current custom connector reference

Dorado Artículos de Pesca is the reference implementation for the custom connector. Its admin can issue a revocable Global Stock token. That token is validated by Global Stock server-side, kept in an encrypted HttpOnly session, and grants only the explicit scopes returned by the store.

## AI

Global Intelligence must never fall back to canned business answers while being presented as real AI. If no provider is configured, the interface should state that the model is not connected.

The OpenAI key is server-only. Do not paste it into source code, screenshots, GitHub issues, or client-side environment variables.
