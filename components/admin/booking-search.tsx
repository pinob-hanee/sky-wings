"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function BookingSearch() {
  const router = useRouter()
  const [searchParams, setSearchParams] = useState({
    email: "",
    lastName: "",
    phone: ""
  })
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const handleSearch = async (e) => {
    e.preventDefault()
    
    // Validate that at least one field is filled
    if (!searchParams.email && !searchParams.lastName && !searchParams.phone) {
      setError("Please enter at least one search criteria")
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      // In a real app, you would search by these parameters
      // For demo purposes, we'll just return mock data
      setTimeout(() => {
        const mockResults = [
          {
            bookingReference: "SKY123456",
            passengerName: "John Doe",
            email: "john.doe@example.com",
            departure: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            status: "CONFIRMED"
          },
          {
            bookingReference: "SKY789012",
            passengerName: "John Doe",
            email: "john.doe@example.com",
            departure: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: "CANCELLED"
          }
        ]
        
        setResults(mockResults)
        setLoading(false)
      }, 1000)
      
    } catch (err) {
      setError("Failed to search for bookings")
      setLoading(false)
    }
  }
  
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSelectBooking = (reference) => {
    router.push(`/admin/bookings/${reference}`)
  }
  
  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="customer@example.com"
              value={searchParams.email}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              placeholder="Doe"
              value={searchParams.lastName}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="+1234567890"
              value={searchParams.phone}
              onChange={handleInputChange}
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              "Search"
            )}
          </Button>
        </div>
      </form>
      
      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}
      
      {results.length > 0 && (
        <div className="border rounded-md">
          <div className="bg-muted px-4 py-2 text-sm font-medium">
            Search Results ({results.length})
          </div>
          <div className="divide-y">
            {results.map((booking) => (
              <div 
                key={booking.bookingReference}
                className="p-4 hover:bg-muted/50 cursor-pointer"
                onClick={() => handleSelectBooking(booking.bookingReference)}
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{booking.bookingReference}</p>
                    <p className="text-sm text-muted-foreground">{booking.passengerName} • {booking.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{new Date(booking.departure).toLocaleDateString()}</p>
                    <p className={`text-sm ${
                      booking.status === "CONFIRMED" ? "text-green-600" : 
                      booking.status === "CANCELLED" ? "text-red-600" : 
                      "text-yellow-600"
                    }`}>
                      {booking.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 