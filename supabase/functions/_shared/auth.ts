import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export function createServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("SUPABASE_URL yoki SUPABASE_SERVICE_ROLE_KEY sozlanmagan");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireAdmin(req: Request): Promise<{ userId: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw Object.assign(new Error("Avtorizatsiya talab etiladi"), { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const supabase = createServiceClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw Object.assign(new Error("Avtorizatsiya xatosi"), { status: 401 });
  }

  const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });

  if (roleError || !isAdmin) {
    throw Object.assign(new Error("Ruxsat yo'q: admin huquqi talab etiladi"), {
      status: 403,
    });
  }

  return { userId: user.id };
}
