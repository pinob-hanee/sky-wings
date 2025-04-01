"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertCircle, Calendar, User, Plane, Clock, ArrowLeft, Ban, Edit, Send, FileText } from "lucide-react"
import { PassengerEditForm } from "@/components/admin/passenger-edit-form"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function BookingDetailClient({ bookingReference, initialBooking = null, error: initialError = null }) {
  const router = useRouter()
  
  const [booking, setBooking] = useState(initialBooking)
  const [loading, setLoading] = useState(!initialBooking && !initialError)
  const [error, setError] = useState(initialError)
  const [cancellationReason, setCancellationReason] = useState("")
  const [isCancelling, setIsCancelling] = useState(false)
  const [isResendingEmail, setIsResendingEmail] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  useEffect(() => {
    const fetchBooking = async () => {
      if (initialBooking || initialError) return;
      
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/api/admin/bookings/${bookingReference}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch booking details')
        }
        
        const data = await response.json()
        setBooking(data)
        setError(null)
      } catch (err) {
        setError("Failed to fetch booking details")
      } finally {
        setLoading(false)
      }
    }
    
    if (bookingReference && !initialBooking && !initialError) {
      fetchBooking()
    }
  }, [bookingReference, initialBooking, initialError])
  
  const showToast = (options) => {
    // Create and dispatch a custom event for the toast
    const event = new CustomEvent("toast", { 
      detail: options
    });
    window.dispatchEvent(event);
  };
  
  const handleCancelBooking = async () => {
    try {
      setIsCancelling(true)
      setError(null)
      
      const response = await fetch(`${API_BASE_URL}/api/admin/bookings/${bookingReference}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: cancellationReason }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking')
      }
      
      setBooking(data.booking)
      setCancellationReason("")
      setDialogOpen(false)
      
      showToast({
        title: "Booking Cancelled",
        description: "The booking has been successfully cancelled."
      })
    } catch (err) {
      console.error("Cancel booking error:", err)
      setError(err.message || "Failed to cancel booking")
      showToast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to cancel booking. Please try again."
      })
    } finally {
      setIsCancelling(false)
    }
  }
  
  const handlePassengerUpdate = async (updatedPassengers) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${API_BASE_URL}/api/admin/bookings/${bookingReference}/passengers`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passengers: updatedPassengers }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update passenger details')
      }
      
      setBooking(data.booking)
      setDialogOpen(false)
      
      showToast({
        title: "Passenger Updated",
        description: "Passenger details have been successfully updated."
      })
    } catch (err) {
      console.error("Update passenger error:", err)
      setError(err.message || "Failed to update passenger details")
      showToast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to update passenger details. Please try again."
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleResendEmail = async () => {
    try {
      setIsResendingEmail(true)
      
      const response = await fetch(`${API_BASE_URL}/api/admin/bookings/${bookingReference}/resend-email`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to resend email')
      }
      
      const data = await response.json()
      showToast({
        title: "Email Sent",
        description: `Confirmation email has been sent to ${data.sentTo}`
      })
    } catch (err) {
      showToast({
        variant: "destructive",
        title: "Error",
        description: "Failed to resend confirmation email. Please try again."
      })
    } finally {
      setIsResendingEmail(false)
    }
  }
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">Loading booking details...</p>
        </div>
      </div>
    )
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
          <Button onClick={() => router.push('/admin')}>Return to Admin Portal</Button>
        </div>
      </div>
    )
  }
  
  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Booking Not Found</AlertTitle>
          <AlertDescription>The booking reference {bookingReference} could not be found.</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button onClick={() => router.push('/admin')}>Return to Admin Portal</Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6 pl-0 flex items-center gap-2"
          onClick={() => router.push('/admin')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Portal
        </Button>
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">Booking {bookingReference}</h1>
            <p className="text-muted-foreground">
              Created on {format(parseISO(booking.createdAt), 'MMMM d, yyyy')}
            </p>
          </div>
          <Badge 
            className={
              booking.status === "CONFIRMED" ? "bg-green-500" : 
              booking.status === "CANCELLED" ? "bg-red-500" : 
              "bg-yellow-500"
            }
          >
            {booking.status}
          </Badge>
        </div>
        
        {booking.status === "CANCELLED" && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Booking Cancelled</AlertTitle>
            <AlertDescription>
              This booking was cancelled on {format(parseISO(booking.cancelledAt), 'MMMM d, yyyy')}
              {booking.cancellationReason && (
                <p className="mt-2">Reason: {booking.cancellationReason}</p>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Booking Details
            </TabsTrigger>
            <TabsTrigger value="passengers" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Passengers
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Actions
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Flight Details</CardTitle>
                <CardDescription>Information about the booked flight</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Flight Number</p>
                    <p className="font-medium">{booking.flight.airline} {booking.flight.flightNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{format(parseISO(booking.flight.departure), 'MMMM d, yyyy')}</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-lg">{format(parseISO(booking.flight.departure), 'h:mm a')}</p>
                    <p className="text-muted-foreground">{booking.flight.from}</p>
                  </div>
                  
                  <div className="flex-1 mx-4 px-4 flex flex-col items-center">
                    <div className="w-full flex items-center gap-1 my-1">
                      <div className="h-[2px] flex-grow bg-muted"></div>
                      <Plane className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium text-lg">{format(parseISO(booking.flight.arrival), 'h:mm a')}</p>
                    <p className="text-muted-foreground">{booking.flight.to}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium">Total Amount</p>
                    <p className="text-muted-foreground text-sm">
                      {booking.passengers.length} passenger{booking.passengers.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="text-2xl font-bold">${booking.totalPrice.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="passengers">
            <Card>
              <CardHeader>
                <CardTitle>Passenger Information</CardTitle>
                <CardDescription>Details of all passengers on this booking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {booking.passengers.map((passenger, index) => (
                  <div key={index} className="border p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium">
                          {passenger.firstName} {passenger.lastName}
                          {index === 0 && (
                            <Badge variant="outline" className="ml-2">Primary</Badge>
                          )}
                        </h3>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3 mr-2" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Passenger Details</DialogTitle>
                            <DialogDescription>
                              Make changes to the passenger information
                            </DialogDescription>
                          </DialogHeader>
                          <PassengerEditForm 
                            passenger={passenger} 
                            index={index}
                            onSave={(updatedPassenger) => {
                              const updatedPassengers = [...booking.passengers];
                              updatedPassengers[index] = updatedPassenger;
                              handlePassengerUpdate(updatedPassengers);
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {passenger.email && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p>{passenger.email}</p>
                        </div>
                      )}
                      
                      {passenger.phone && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p>{passenger.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle>Booking Actions</CardTitle>
                <CardDescription>Manage this booking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-destructive/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-destructive flex items-center gap-2">
                        <Ban className="h-5 w-5" />
                        Cancel Booking
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">
                        This will cancel the booking and notify the customer.
                      </p>
                      
                      {booking.status === "CANCELLED" ? (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Already Cancelled</AlertTitle>
                          <AlertDescription>
                            This booking has already been cancelled.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="destructive">Cancel Booking</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Cancel Booking</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to cancel this booking? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Cancellation Reason</p>
                                <Textarea
                                  placeholder="Enter reason for cancellation"
                                  value={cancellationReason}
                                  onChange={(e) => setCancellationReason(e.target.value)}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setCancellationReason("")}>
                                Cancel
                              </Button>
                              <Button 
                                variant="destructive" 
                                onClick={handleCancelBooking}
                                disabled={isCancelling}
                              >
                                {isCancelling ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  "Confirm Cancellation"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Resend Confirmation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">
                        Resend the booking confirmation email to the customer.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={handleResendEmail}
                        disabled={isResendingEmail}
                      >
                        {isResendingEmail ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Resend Email"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 