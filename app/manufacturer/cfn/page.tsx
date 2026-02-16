"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const CFN_ROUTE_MAP: Record<string, string> = {
  dashboard: "/dashboard",
  "plan-shipment": "/plan-shipment",
  optimizer: "/optimizer",
  historical: "/historical",
  "route-demo": "/route-demo",
};

const DEFAULT_CFN_URL = "http://localhost:3001";

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, "");

const buildIframeUrl = (baseUrl: string, routePath: string): string => {
  const query = "embed=vendor";
  return `${baseUrl}${routePath}${routePath.includes("?") ? "&" : "?"}${query}`;
};

export default function CfnIntegrationPage() {
  const searchParams = useSearchParams();
  const [frameLoading, setFrameLoading] = useState(true);
  const [frameError, setFrameError] = useState(false);

  const routePath = useMemo(() => {
    const view = searchParams.get("view");
    if (view && CFN_ROUTE_MAP[view]) {
      return CFN_ROUTE_MAP[view];
    }
    return CFN_ROUTE_MAP.dashboard;
  }, [searchParams]);

  const cfnBaseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_CFN_FRONTEND_URL ?? DEFAULT_CFN_URL
  );
  const frameSrc = buildIframeUrl(cfnBaseUrl, routePath);

  useEffect(() => {
    setFrameError(false);
    setFrameLoading(true);
  }, [routePath]);

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="relative overflow-hidden border-t border-neutral-800 bg-black">
        {frameLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-950/90">
            <p className="text-sm text-neutral-200">Loading CFN workspace...</p>
          </div>
        )}

        {frameError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral-950/95 p-6">
            <div className="max-w-lg text-center">
              <p className="text-lg font-semibold text-red-400">
                Unable to load embedded CFN frontend
              </p>
              <p className="mt-2 text-sm text-neutral-300">
                Ensure CFN frontend is running at <code>{cfnBaseUrl}</code>.
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Source URL: <code>{frameSrc}</code>
              </p>
            </div>
          </div>
        )}

        <iframe
          src={frameSrc}
          title="CFN Workspace"
          className="h-[calc(100vh-74px)] min-h-[760px] w-full border-0 bg-white"
          onLoad={() => setFrameLoading(false)}
          onError={() => {
            setFrameLoading(false);
            setFrameError(true);
          }}
        />
      </div>
    </div>
  );
}
