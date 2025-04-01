"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookingSearch } from "@/components/admin/booking-search"
import { BookingList } from "@/components/admin/booking-list"
import { Shield, Search, List } from "lucide-react"

export default function AdminPage() {
  const router = useRouter()
  const [bookingReference, setBookingReference] = useState("")
  
  const handleSearch = () => {
    if (bookingReference.trim()) {
      router.push(`/admin/bookings/${bookingReference}`)
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Customer Service Portal</h1>
        </div>
        
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Booking
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              All Bookings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle>Find Booking</CardTitle>
                <CardDescription>
                  Enter a booking reference to find and manage a customer's booking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input 
                    placeholder="Booking reference (e.g., SKY123456)" 
                    value={bookingReference}
                    onChange={(e) => setBookingReference(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch}>Search</Button>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start">
                <p className="text-sm text-muted-foreground">
                  You can also search by passenger name or email in the advanced search below
                </p>
                <div className="w-full mt-4">
                  <BookingSearch />
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="list">
            <BookingList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 