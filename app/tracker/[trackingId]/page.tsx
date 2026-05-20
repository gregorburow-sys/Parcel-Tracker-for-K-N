import ParcelTracker from "@/components/ParcelTracker";

interface TrackerPageProps {
  params: { trackingId: string };
}

export default function TrackerPage({ params }: TrackerPageProps) {
  const trackingId = decodeURIComponent(params.trackingId);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <ParcelTracker trackingId={trackingId} />
    </div>
  );
}
