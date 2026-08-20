"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Keeps the browser session warm: refresh on mount and when the tab becomes
 * visible again, so closing the laptop overnight does not force a new magic link.
 */
export function SessionKeepalive() {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let cancelled = false;
    const supabase = createClient();

    async function refresh() {
      try {
        await supabase.auth.getSession();
      } catch {
        // Ignore — middleware will also attempt refresh on the next navigation.
      }
    }

    void refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // Subscription keeps the client auth listener alive for auto-refresh.
    });

    function onVisible() {
      if (!cancelled && document.visibilityState === "visible") {
        void refresh();
      }
    }

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
