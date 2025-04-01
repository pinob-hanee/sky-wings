"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { Loader2, AlertCircle, Clock, Plane } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"


interface FlightSegment {
  from: string
  to: string
  departure: string
  arrival: string
  flightNumber: string
  duration: string
}

interface Flight {
  id: string
  from: string
  to: string
  departure: string
  arrival: string
  price: string
  currency: string
  airline: string
  flightNumber: string
  travelClass: string
  stops: number
  duration: string
  segments: FlightSegment[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlights = async () => {
      setLoading(true);
      setError(null);

      try {
        // Health check
        const healthRes = await fetch(`${API_BASE_URL}/health`);
        if (!healthRes.ok) throw new Error("Flight search service is not responding");

        // Fetch flights
        const response = await fetch(`${API_BASE_URL}/api/flights?${searchParams.toString()}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch flights");
        }

        const data = await response.json();
        
        // Check if the response is an object with a message property
        if (data && typeof data === 'object' && 'message' in data) {
          // This is a message response, not an array of flights
          setFlights([]);
          setError(data.message);
        } else {
          // This is an array of flights
          setFlights(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching flights:", error);
        setError(error instanceof Error ? error.message : "An error occurred while fetching flights");
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [searchParams]);

  // Format duration string (PT2H30M -> 2h 30m)
  const formatDuration = (duration: string) => {
    const hourMatch = duration.match(/(\d+)H/);
    const minuteMatch = duration.match(/(\d+)M/);
    
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
    
    return `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}`.trim();
  };

  // Memoize flights to prevent unnecessary re-renders
  const memoizedFlights = useMemo(() => flights, [flights]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Searching for the best flights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (memoizedFlights.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>No flights found</AlertTitle>
            <AlertDescription>
              We couldn&apos;t find any flights matching your search criteria. Please try different dates or airports.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Flight Search Results</h1>
        <p className="text-muted-foreground mb-6">
          Found {memoizedFlights.length} flights from {searchParams.get('from')} to {searchParams.get('to')} on {format(parseISO(searchParams.get('date') as string), 'MMMM d, yyyy')}
        </p>
        
        <div className="space-y-4">
          {memoizedFlights.map((flight) => (
            <Card key={flight.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">
                      {flight.from} to {flight.to}
                    </CardTitle>
                    <CardDescription>
                      Flight {flight.flightNumber} • {flight.airline} • {flight.travelClass.charAt(0) + flight.travelClass.slice(1).toLowerCase()}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${parseFloat(flight.price).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">per passenger</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Duration: {formatDuration(flight.duration)}</span>
                  </div>
                  <Badge variant={flight.stops === 0 ? "outline" : "secondary"}>
                    {flight.stops === 0 ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                  </Badge>
                </div>
                
                {flight.segments.map((segment, index) => (
                  <div key={index} className="mb-4">
                    {index > 0 && (
                      <div className="my-4 flex items-center gap-2 text-muted-foreground">
                        <Separator className="flex-grow" />
                        <span className="text-xs">Connection</span>
                        <Separator className="flex-grow" />
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{format(parseISO(segment.departure), 'h:mm a')}</p>
                        <p className="text-sm text-muted-foreground">{segment.from}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(segment.departure), 'MMM d, yyyy')}</p>
                      </div>
                      
                      <div className="flex-1 mx-4 px-4 flex flex-col items-center">
                        <p className="text-xs text-muted-foreground">{formatDuration(segment.duration)}</p>
                        <div className="w-full flex items-center gap-1 my-1">
                          <div className="h-[2px] flex-grow bg-muted"></div>
                          <Plane className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground">Flight {segment.flightNumber}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium">{format(parseISO(segment.arrival), 'h:mm a')}</p>
                        <p className="text-sm text-muted-foreground">{segment.to}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(segment.arrival), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
              
              <CardFooter className="bg-muted/50 flex justify-end py-5">
                <Button 
                  onClick={() => router.push(`/booking?flightId=${flight.id}`)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
                >
                  Select Flight
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
