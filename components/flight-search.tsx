"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Info, Plane, Users, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { motion } from "framer-motion"

interface FlightSearchForm {
  from: string
  to: string
  date: Date
  passengers: number
  directOnly: boolean
}

export default function FlightSearch() {
  const router = useRouter()
  const [isSearching, setIsSearching] = useState(false)
  
  const form = useForm<FlightSearchForm>({
    defaultValues: {
      from: "",
      to: "",
      passengers: 1,
      directOnly: false
    },
  })

  const onSubmit = (data: FlightSearchForm) => {
    setIsSearching(true)
    
    // Simulate a slight delay for visual feedback
    setTimeout(() => {
      const searchParams = new URLSearchParams({
        from: data.from.toUpperCase(),
        to: data.to.toUpperCase(),
        date: format(data.date, "yyyy-MM-dd"),
        passengers: data.passengers.toString(),
        directOnly: data.directOnly.toString()
      })
      router.push(`/search?${searchParams.toString()}`)
    }, 500)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-primary/5 p-6 rounded-lg border border-primary/10">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <div className="w-full md:w-2/5">
              <FormField
                control={form.control}
                name="from"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2 text-base">
                      <Plane className="h-4 w-4 rotate-45" />
                      From (IATA Code)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-primary text-primary-foreground">
                            <p>Enter 3-letter airport code (e.g., JFK, LAX, LHR)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Airport code (e.g., JFK)" 
                        {...field} 
                        maxLength={3}
                        onChange={(e) => {
                          field.onChange(e.target.value.toUpperCase())
                        }}
                        value={field.value}
                        className="text-lg font-medium transition-all focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormDescription>
                      3-letter airport code
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="hidden md:flex items-center justify-center">
              <ArrowRight className="h-6 w-6 text-primary" />
            </div>
            
            <div className="w-full md:w-2/5">
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2 text-base">
                      <Plane className="h-4 w-4 -rotate-45" />
                      To (IATA Code)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-primary text-primary-foreground">
                            <p>Enter 3-letter airport code (e.g., JFK, LAX, LHR)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Airport code (e.g., LHR)" 
                        {...field} 
                        maxLength={3}
                        onChange={(e) => {
                          field.onChange(e.target.value.toUpperCase())
                        }}
                        value={field.value}
                        className="text-lg font-medium transition-all focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormDescription>
                      3-letter airport code
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2 text-base">
                    <CalendarIcon className="h-4 w-4" />
                    Departure Date
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal h-12 border-2 hover:bg-primary/5 hover:text-primary hover:border-primary/20",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            <span className="text-base">{format(field.value, "PPP")}</span>
                          ) : (
                            <span className="text-base">Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-5 w-5 opacity-70" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                        className="rounded-md border"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="passengers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />
                    Passengers
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={9}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      className="text-lg font-medium h-12 transition-all focus-visible:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <FormField
          control={form.control}
          name="directOnly"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 bg-secondary/20 p-4 rounded-md border border-secondary/10">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-base">Direct flights only</FormLabel>
                <FormDescription>
                  Show only non-stop flights
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full h-14 text-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          disabled={isSearching}
        >
          {isSearching ? (
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"></div>
              Searching...
            </div>
          ) : (
            "Search Flights"
          )}
        </Button>
      </form>
    </Form>
  )
}