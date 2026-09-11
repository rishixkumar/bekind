import { UserLocationMap } from "@/components/user-location-map";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: `Map · ${SITE_NAME}`,
  description: "See where you are on the map.",
};

export default function MapPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Map</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your location stays in the browser — {SITE_NAME} never stores it.
        </p>
      </div>
      <UserLocationMap />
    </div>
  );
}
