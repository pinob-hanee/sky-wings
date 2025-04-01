"use client"

import { Plane } from "lucide-react"
import { ModeToggle } from "./mode-toggle"
import Link from "next/link"

export default function Navbar() {
  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center space-x-2">
          <Plane className="h-6 w-6" />
          <span className="font-bold text-xl">SkyWings</span>
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          <Link href="/bookings" className="text-sm font-medium">
            My Bookings
          </Link>
          <ModeToggle />
        </div>
      </div>
    </nav>
  )
}