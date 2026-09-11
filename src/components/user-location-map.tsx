"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const LocationMap = dynamic(
  () => import("@/components/location-map").then((m) => m.LocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(70vh,560px)] items-center justify-center rounded-md border border-border bg-muted/40">
        <p className="text-sm text-muted-foreground">Loading map…</p>
      </div>
    ),
  },
);

type GeoState =
  | { status: "loading" }
  | { status: "unsupported" }
  | { status: "denied" }
  | { status: "error"; message: string }
  | { status: "ready"; lat: number; lng: number };

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 60_000,
};

function StatusPanel({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex h-[min(70vh,560px)] flex-col items-center justify-center gap-3 rounded-md border border-border bg-card px-6 py-12 text-center shadow-sm">
      <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-gt-navy dark:text-gt-gold">
        <MapPin className="size-6" aria-hidden />
      </div>
      <div>
        <p className="text-lg font-semibold text-foreground">{title}</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>
      </div>
      {action}
    </div>
  );
}

function applyGeoError(error: GeolocationPositionError): GeoState {
  if (error.code === error.PERMISSION_DENIED) {
    return { status: "denied" };
  }
  return {
    status: "error",
    message: error.message || "Could not read your location.",
  };
}

export function UserLocationMap() {
  const [state, setState] = useState<GeoState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      // Defer so we don't setState synchronously in the effect body.
      const id = window.setTimeout(() => {
        if (!cancelled) setState({ status: "unsupported" });
      }, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(id);
      };
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        setState({
          status: "ready",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        if (cancelled) return;
        setState(applyGeoError(error));
      },
      GEO_OPTIONS,
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const retryLocation = useCallback(() => {
    setState({ status: "loading" });

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "unsupported" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: "ready",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        setState(applyGeoError(error));
      },
      GEO_OPTIONS,
    );
  }, []);

  if (state.status === "loading") {
    return (
      <StatusPanel
        title="Finding you…"
        body="Allow location access when your browser asks so we can center the map."
      />
    );
  }

  if (state.status === "unsupported") {
    return (
      <StatusPanel
        title="Location not supported"
        body="This browser does not support geolocation, so the map cannot center on you."
      />
    );
  }

  if (state.status === "denied") {
    return (
      <StatusPanel
        title="Location permission needed"
        body="BK needs location access to show where you are. Enable it in your browser settings, then try again."
        action={
          <Button type="button" onClick={retryLocation}>
            Try again
          </Button>
        }
      />
    );
  }

  if (state.status === "error") {
    return (
      <StatusPanel
        title="Couldn’t get your location"
        body={state.message}
        action={
          <Button type="button" onClick={retryLocation}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border shadow-sm">
      <div className="h-[min(70vh,560px)] w-full">
        <LocationMap lat={state.lat} lng={state.lng} />
      </div>
      <p className="border-t border-border bg-card px-3 py-2 text-xs text-muted-foreground">
        Marker shows your current position. Map tiles © OpenStreetMap.
      </p>
    </div>
  );
}
