import { createClient } from "@supabase/supabase-js";

type AuthorizedRequest = {
  ok: true;
  userId: string;
  mode: "supabase" | "local-demo";
};

type UnauthorizedRequest = {
  ok: false;
  code: "AUTH_REQUIRED" | "AUTH_NOT_CONFIGURED" | "FORBIDDEN";
  status: 401 | 403 | 503;
};

export type ApiAuthorization = AuthorizedRequest | UnauthorizedRequest;

export function isApiAuthConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}

export function isApiAuthAvailable() {
  return isApiAuthConfigured() || process.env.NODE_ENV !== "production";
}

export async function authorizeApiRequest(
  request: Request
): Promise<ApiAuthorization> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    if (process.env.NODE_ENV !== "production") {
      return {
        ok: true,
        userId: "local-demo",
        mode: "local-demo"
      };
    }

    return {
      ok: false,
      code: "AUTH_NOT_CONFIGURED",
      status: 503
    };
  }

  const authorization = request.headers.get("authorization")?.trim() ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return {
      ok: false,
      code: "AUTH_REQUIRED",
      status: 401
    };
  }

  const token = authorization.slice(7).trim();
  if (!token || token.length > 4096) {
    return {
      ok: false,
      code: "AUTH_REQUIRED",
      status: 401
    };
  }

  const supabase = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser(token);

    if (error || !user?.id) {
      return {
        ok: false,
        code: "AUTH_REQUIRED",
        status: 401
      };
    }

    const membership = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: profile, error: profileError } = await membership
      .from("global_stock_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile?.user_id) {
      return {
        ok: false,
        code: "AUTH_REQUIRED",
        status: 401
      };
    }

    return {
      ok: true,
      userId: user.id,
      mode: "supabase"
    };
  } catch {
    return {
      ok: false,
      code: "AUTH_REQUIRED",
      status: 401
    };
  }
}


export type BusinessApiAuthorization =
  | (AuthorizedRequest & { role: string })
  | UnauthorizedRequest;

export async function authorizeBusinessRequest(
  request: Request,
  businessId: string,
  allowedRoles?: readonly string[]
): Promise<BusinessApiAuthorization> {
  const authorization = await authorizeApiRequest(request);
  if (!authorization.ok) return authorization;

  if (authorization.mode === "local-demo") {
    return {
      ...authorization,
      role: "owner"
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const bearer = request.headers.get("authorization")?.trim() ?? "";

  if (!url || !anonKey || !bearer.startsWith("Bearer ")) {
    return {
      ok: false,
      code: "AUTH_NOT_CONFIGURED",
      status: 503
    };
  }

  const supabase = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        Authorization: bearer
      }
    }
  });

  try {
    const { data: membership, error } = await supabase
      .from("global_stock_members")
      .select("role,active")
      .eq("business_id", businessId)
      .eq("user_id", authorization.userId)
      .eq("active", true)
      .maybeSingle();

    const role = String(membership?.role || "");
    if (error || !membership?.active || !role) {
      return {
        ok: false,
        code: "FORBIDDEN",
        status: 403
      };
    }

    if (allowedRoles?.length && !allowedRoles.includes(role)) {
      return {
        ok: false,
        code: "FORBIDDEN",
        status: 403
      };
    }

    return {
      ...authorization,
      role
    };
  } catch {
    return {
      ok: false,
      code: "FORBIDDEN",
      status: 403
    };
  }
}
