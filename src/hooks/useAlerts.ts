import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AlertRecord = {
  id: string;
  user_id: string | null;
  external_id: string | null;
  symbol: string | null;
  title: string | null;
  summary: string | null;
  full_summary: string | null;
  action: "buy" | "trim" | "hold";
  priority: "high" | "medium" | "low";
  confidence: "high" | "medium" | "low";
  last_price: number | null;
  change_pct: number | null;
  link: string | null;
  source: string | null;
  category: string | null;
  payload: any | null;
  lifecycle_status: "new" | "read" | "archived";
  read_at: string | null;
  archived_at: string | null;
  expires_at: string | null;
  created_at: string;
};

type UseAlertsOptions = {
  includeGlobal?: boolean; // include user_id null
  status?: "all" | "new" | "read" | "archived";
  limit?: number;
};

export function useAlerts(opts: UseAlertsOptions = {}) {
  const { includeGlobal = true, status = "all", limit = 50 } = opts;
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const { data: session } = await supabase.auth.getSession();
        const uid = session?.session?.user?.id ?? null;

        // Build query
        let query = supabase
          .from("alerts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (status !== "all") {
          query = query.eq("lifecycle_status", status);
        }

        if (uid) {
          if (includeGlobal) {
            query = query.or(`user_id.eq.${uid},user_id.is.null`);
          } else {
            query = query.eq("user_id", uid);
          }
        } else {
          // Not logged in: only global alerts
          query = query.is("user_id", null);
        }

        const { data, error } = await query;
        if (error) throw error;
        if (mounted) setAlerts((data as AlertRecord[]) || []);
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load alerts");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    // Realtime subscription
    const channel = supabase
      .channel("alerts_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        () => {
          // Reload on any change; keep it simple and robust
          load();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [includeGlobal, status, limit]);

  const hasData = useMemo(() => alerts.length > 0, [alerts]);

  return { alerts, loading, error, hasData };
}

export async function markAlertRead(id: string) {
  const { error } = await supabase
    .from("alerts")
    .update({ lifecycle_status: "read", read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function archiveAlert(id: string) {
  const { error } = await supabase
    .from("alerts")
    .update({ lifecycle_status: "archived", archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
