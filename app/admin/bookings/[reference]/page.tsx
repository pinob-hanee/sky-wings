// This is a static page that will be generated at build time
import { Suspense } from "react"
import BookingDetailClient from "@/components/admin/booking-detail-client"
import { Loader2 } from "lucide-react"

// This is required for static export - must include all possible paths
export function generateStaticParams() {
  // Pre-generate these specific booking references
  return [
    { reference: 'SKY123456' },
    { reference: 'SKY789012' },
    { reference: 'SKY185612' }
  ]
}

export default function BookingDetailPage({ params }: { params: { reference: string } }) {
  const bookingReference = params.reference
  
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">Loading booking details...</p>
        </div>
      </div>
    }>
      <BookingDetailClient bookingReference={bookingReference} initialBooking={undefined} error={null} />
    </Suspense>
  )
} 