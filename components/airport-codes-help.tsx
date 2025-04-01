"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { HelpCircle } from "lucide-react"

const commonAirports = [
  { code: "JFK", name: "John F. Kennedy International Airport", city: "New York" },
  { code: "LAX", name: "Los Angeles International Airport", city: "Los Angeles" },
  { code: "LHR", name: "Heathrow Airport", city: "London" },
  { code: "CDG", name: "Charles de Gaulle Airport", city: "Paris" },
  { code: "DXB", name: "Dubai International Airport", city: "Dubai" },
  { code: "HND", name: "Haneda Airport", city: "Tokyo" },
  { code: "SIN", name: "Singapore Changi Airport", city: "Singapore" },
  { code: "SYD", name: "Sydney Airport", city: "Sydney" },
  { code: "CAI", name: "Cairo International Airport", city: "Cairo" },
  { code: "JNB", name: "O.R. Tambo International Airport", city: "Johannesburg" },
]

export function AirportCodesHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <HelpCircle className="h-4 w-4" />
          Airport Codes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Common Airport IATA Codes</DialogTitle>
          <DialogDescription>
            Use these 3-letter codes when searching for flights
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-auto max-h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">IATA Code</TableHead>
                <TableHead>Airport Name</TableHead>
                <TableHead>City</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commonAirports.map((airport) => (
                <TableRow key={airport.code}>
                  <TableCell className="font-medium">{airport.code}</TableCell>
                  <TableCell>{airport.name}</TableCell>
                  <TableCell>{airport.city}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
} 