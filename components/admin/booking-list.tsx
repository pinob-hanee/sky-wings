"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Calendar, RefreshCw } from "lucide-react"
import { CalendarIcon } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function BookingList({ initialBookings = null }) {
  const router = useRouter()
  const [bookings, setBookings] = useState(initialBookings || [])
  const [loading, setLoading] = useState(!initialBookings)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    status: "all",
    from: "",
    to: "",
    date: null
  })
  
  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Build query string from filters
      const queryParams = new URLSearchParams()
      if (filters.status && filters.status !== "all") queryParams.append('status', filters.status)
      if (filters.from) queryParams.append('from', filters.from)
      if (filters.to) queryParams.append('to', filters.to)
      if (filters.date) queryParams.append('date', filters.date.toISOString())
      
      const response = await fetch(`${API_BASE_URL}/api/admin/bookings?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }
      
      const data = await response.json()
      setBookings(data)
    } catch (err) {
      setError("Failed to fetch bookings")
      console.error("Error fetching bookings:", err)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    if (!initialBookings) {
      fetchBookings()
    }
  }, [filters, initialBookings])
  
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSelectBooking = (reference) => {
    router.push(`/admin/bookings/${reference}`)
  }
  
  const handleClearFilters = () => {
    setFilters({
      status: "all",
      from: "",
      to: "",
      date: null
    })
  }
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge className="bg-green-500">Confirmed</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="status">Status</Label>
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Any status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="from">From</Label>
          <Input 
            id="from" 
            placeholder="Departure airport" 
            value={filters.from}
            onChange={(e) => handleFilterChange('from', e.target.value)}
          />
        </div>
        
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="to">To</Label>
          <Input 
            id="to" 
            placeholder="Arrival airport" 
            value={filters.to}
            onChange={(e) => handleFilterChange('to', e.target.value)}
          />
        </div>
        
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.date ? format(filters.date, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={filters.date}
                onSelect={(date) => handleFilterChange('date', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>
          <Button onClick={fetchBookings} className="gap-1">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-muted-foreground">No bookings found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => (
            <Card 
              key={booking.bookingReference} 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleSelectBooking(booking.bookingReference)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{booking.bookingReference}</CardTitle>
                  {getStatusBadge(booking.status)}
                </div>
                <CardDescription>
                  {booking.passengers && booking.passengers.length > 0 ? 
                    `${booking.passengers[0].firstName} ${booking.passengers[0].lastName}` + 
                    (booking.passengers.length > 1 ? ` + ${booking.passengers.length - 1} more` : '')
                    : 'No passenger info'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <div className="font-medium">{booking.flight?.from} → {booking.flight?.to}</div>
                    <div className="text-muted-foreground">
                      {booking.flight?.departure ? format(new Date(booking.flight.departure), 'dd MMM yyyy') : 'N/A'}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="text-muted-foreground">
                      {booking.flight?.airline} {booking.flight?.flightNumber}
                    </div>
                    <div className="font-medium">
                      {booking.totalPrice?.toFixed(2)} {booking.currency}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 