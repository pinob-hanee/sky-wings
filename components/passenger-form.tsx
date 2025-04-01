// components/passenger-form.tsx
"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Plus, Trash } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Define validation schema
const passengerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(6, "Please enter a valid phone number"),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.date({
    required_error: "Please select a date of birth",
  })
});

export function PassengerForm({ onSubmit }: { onSubmit: (passengers: any[]) => void }, passengerCount = 1) {
  const [passengers, setPassengers] = useState(Array(passengerCount).fill(null).map(() => ({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "unspecified",
    dateOfBirth: null
  })));
  
  const [currentPassenger, setCurrentPassenger] = useState(0);
  const [errors, setErrors] = useState<string[][]>([]);
  
  const handleInputChange = (index: number, field: string, value: string | Date) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = {
      ...updatedPassengers[index],
      [field]: value
    };
    setPassengers(updatedPassengers);
  };
  
  const validatePassenger = (passenger: z.infer<typeof passengerSchema>, index: number) => {
    try {
      passengerSchema.parse(passenger);
      return true;
    } catch (error) {
      setErrors(prev => {
        const newErrors = [...prev];
        newErrors[index] = (error as z.ZodError).errors.map(e => e.message);
        return newErrors;
      });
      return false;
    }
  };
  const handleNext = () => {
    const currentPassengerData = {
      ...passengers[currentPassenger],
      gender: passengers[currentPassenger].gender === "unspecified" ? "other" : passengers[currentPassenger].gender,
      dateOfBirth: passengers[currentPassenger].dateOfBirth || new Date()
    } as { firstName: string; lastName: string; email: string; phone: string; gender: "male" | "female" | "other"; dateOfBirth: Date };

    if (validatePassenger(currentPassengerData, currentPassenger)) {
      if (currentPassenger < passengers.length - 1) {
        setCurrentPassenger(currentPassenger + 1);
      } else {
        onSubmit(passengers.map(p => ({
          ...p,
          gender: p.gender === "unspecified" ? "other" : p.gender,
          dateOfBirth: p.dateOfBirth || new Date()
        })));
      }
    }
  };
  
  const handlePrevious = () => {
    if (currentPassenger > 0) {
      setCurrentPassenger(currentPassenger - 1);
    }
  };
  
  const handleAddPassenger = () => {
    setPassengers([...passengers, {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: "unspecified",
      dateOfBirth: null
    }]);
  };
  
  const handleRemovePassenger = (index: number) => {
    if (passengers.length > 1) {
      const updatedPassengers = passengers.filter((_, i) => i !== index);
      setPassengers(updatedPassengers);
      if (currentPassenger >= updatedPassengers.length) {
        setCurrentPassenger(updatedPassengers.length - 1);
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Passenger {currentPassenger + 1} of {passengers.length}</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddPassenger}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Passenger
          </Button>
          {passengers.length > 1 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleRemovePassenger(currentPassenger)}
            >
              <Trash className="h-4 w-4 mr-1" /> Remove
            </Button>
          )}
        </div>
      </div>
      
      {errors[currentPassenger] && errors[currentPassenger].length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5">
              {errors[currentPassenger].map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Enter the passenger&apos;s personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                value={passengers[currentPassenger].firstName}
                onChange={(e) => handleInputChange(currentPassenger, 'firstName', e.target.value)}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                value={passengers[currentPassenger].lastName}
                onChange={(e) => handleInputChange(currentPassenger, 'lastName', e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                value={passengers[currentPassenger].email}
                onChange={(e) => handleInputChange(currentPassenger, 'email', e.target.value)}
                placeholder="john.doe@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                value={passengers[currentPassenger].phone}
                onChange={(e) => handleInputChange(currentPassenger, 'phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select 
                value={passengers[currentPassenger].gender || "unspecified"}
                onValueChange={(value) => handleInputChange(currentPassenger, 'gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="unspecified">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !passengers[currentPassenger].dateOfBirth && "text-muted-foreground"
                    )}
                  >
                    {passengers[currentPassenger].dateOfBirth ? (
                      format(passengers[currentPassenger].dateOfBirth, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={passengers[currentPassenger].dateOfBirth}
                    onSelect={(date) => handleInputChange(currentPassenger, 'dateOfBirth', date)}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentPassenger === 0}
          >
            Previous
          </Button>
          <Button onClick={handleNext}>
            {currentPassenger < passengers.length - 1 ? "Next Passenger" : "Continue to Payment"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}