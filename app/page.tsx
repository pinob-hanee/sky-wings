import FlightSearch from "@/components/flight-search"
import { AirportCodesHelp } from "@/components/airport-codes-help"
import { Card } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="min-h-screen bg-[url('https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center bg-no-repeat">
      <div className="min-h-screen bg-black/50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white mb-12">
            <h1 className="text-5xl font-bold mb-4">Find Your Perfect Flight</h1>
            <p className="text-xl mb-4">Search hundreds of airlines and book with confidence</p>
            <AirportCodesHelp />
          </div>
          <Card className="max-w-4xl mx-auto p-6">
            <FlightSearch />
          </Card>
        </div>
      </div>
    </main>
  )
}