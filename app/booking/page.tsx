// app/booking/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, AlertCircle, User, CreditCard, Check, Plane } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { format, parseISO } from "date-fns"
import { Steps } from "@/components/steps"
import { PassengerForm } from "@/components/passenger-form"
import { PaymentForm } from "@/components/payment-form"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper function to format duration
const formatDuration = (duration) => {
  // ISO8601 duration format: PT2H30M
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return duration;
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  
  return `${hours}h ${minutes}m`;
};

export default function BookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const flightId = searchParams.get('flightId');
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [passengerData, setPassengerData] = useState([]);
  const [paymentData, setPaymentData] = useState(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingReference, setBookingReference] = useState("");

  useEffect(() => {
    const fetchFlightDetails = async () => {
      if (!flightId) {
        setError("No flight selected");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch flight details from the API
        const response = await fetch(`${API_BASE_URL}/api/flights/${flightId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch flight details');
        }
        
        const flightData = await response.json();
        setFlight(flightData);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch flight details");
        setLoading(false);
      }
    };

    fetchFlightDetails();
  }, [flightId]);

  const handlePassengerSubmit = (data) => {
    setPassengerData(data);
    setCurrentStep(3);
  };

  const handlePaymentSubmit = (data) => {
    setPaymentData(data);
    
    // Create booking with Amadeus API
    setLoading(true);
    
    // Prepare booking data
    const bookingData = {
      flightId,
      passengers: passengerData,
      payment: {
        ...data,
        // Remove sensitive data before sending
        cardNumber: data.cardNumber.replace(/\d(?=\d{4})/g, "*"),
        cvv: "***"
      }
    };
    
    // Make API call to create booking
    fetch(`${API_BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Booking failed');
      }
      return response.json();
    })
    .then(data => {
      setBookingComplete(true);
      setBookingReference(data.bookingReference || `SKY${Math.floor(100000 + Math.random() * 900000)}`);
      setCurrentStep(4);
      setLoading(false);
    })
    .catch(error => {
      setError("Failed to complete booking. Please try again.");
      setLoading(false);
    });
  };

  if (loading && !flight) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">Loading flight details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button onClick={() => router.push('/search')}>Return to Search</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Steps 
            steps={[
              { id: 1, label: "Flight Details", icon: <Plane className="h-5 w-5" /> },
              { id: 2, label: "Passenger Information", icon: <User className="h-5 w-5" /> },
              { id: 3, label: "Payment", icon: <CreditCard className="h-5 w-5" /> },
              { id: 4, label: "Confirmation", icon: <Check className="h-5 w-5" /> }
            ]}
            currentStep={currentStep}
          />
        </div>
        
        <div className="space-y-6">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {currentStep === 1 && flight && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Flight Details</CardTitle>
                  <CardDescription>Review your selected flight</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{flight.airline} {flight.flightNumber}</h3>
                      <p className="text-muted-foreground">{format(parseISO(flight.departure), 'EEEE, MMMM d, yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${parseFloat(flight.price).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">per passenger</p>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{format(parseISO(flight.departure), 'h:mm a')}</p>
                      <p className="text-sm text-muted-foreground">{flight.from}</p>
                    </div>
                    
                    <div className="flex-1 mx-4 px-4 flex flex-col items-center">
                      <p className="text-xs text-muted-foreground">{formatDuration(flight.duration)}</p>
                      <div className="w-full flex items-center gap-1 my-1">
                        <div className="h-[2px] flex-grow bg-muted"></div>
                        <Plane className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {flight.stops === 0 ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium">{format(parseISO(flight.arrival), 'h:mm a')}</p>
                      <p className="text-sm text-muted-foreground">{flight.to}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={() => setCurrentStep(2)}>Continue to Passenger Information</Button>
                </CardFooter>
              </Card>
            </>
          )}
          
          {currentStep === 2 && (
            <PassengerForm 
              passengerCount={parseInt(searchParams.get('passengers') || '1')}
              onSubmit={handlePassengerSubmit}
              onBack={() => setCurrentStep(1)}
            />
          )}
          
          {currentStep === 3 && (
            <PaymentForm 
              amount={parseFloat(flight.price) * passengerData.length}
              onSubmit={handlePaymentSubmit}
              onBack={() => setCurrentStep(2)}
            />
          )}
          
          {currentStep === 4 && bookingComplete && (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
                <CardDescription>Your flight has been successfully booked</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 p-6 rounded-lg border border-muted">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-medium">Booking Reference</h3>
                    <p className="text-3xl font-bold tracking-wider mt-2">{bookingReference}</p>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Flight</p>
                      <p className="font-medium">{flight.airline} {flight.flightNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{format(parseISO(flight.departure), 'MMMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">From</p>
                      <p className="font-medium">{flight.from}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">To</p>
                      <p className="font-medium">{flight.to}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Departure</p>
                      <p className="font-medium">{format(parseISO(flight.departure), 'h:mm a')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Arrival</p>
                      <p className="font-medium">{format(parseISO(flight.arrival), 'h:mm a')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Passengers</p>
                      <p className="font-medium">{passengerData.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="font-medium">${(parseFloat(flight.price) * passengerData.length).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-900">
                  <p className="text-green-800 dark:text-green-400 text-sm">
                    A confirmation email has been sent to {passengerData[0].email}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button onClick={() => router.push('/')}>Return to Home</Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}