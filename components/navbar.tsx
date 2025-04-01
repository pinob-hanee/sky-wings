"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"
import { Plane, Menu, X, User, Search } from "lucide-react"

export default function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const isActive = (path: string) => pathname === path
  
  const navItems = [
    { name: "Home", href: "/" },
    { name: "Flights", href: "/flights" },
    { name: "My Booking", href: "/my-booking" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ]
  
  const isAdmin = pathname.startsWith('/admin')
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Plane className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">SkyWings</span>
            </Link>
            
            <nav className="hidden md:ml-10 md:flex md:space-x-6">
              {!isAdmin && navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    isActive(item.href) ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.name}
                </Link>
              ))}
              
              {isAdmin && (
                <span className="text-sm font-medium text-primary">Admin Portal</span>
              )}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {!isAdmin && (
              <Button asChild variant="ghost" size="sm" className="hidden md:flex">
                <Link href="/my-booking">
                  <Search className="h-4 w-4 mr-2" />
                  Find Booking
                </Link>
              </Button>
            )}
            
            {!isAdmin && (
              <Button asChild size="sm" className="hidden md:flex">
                <Link href="/login">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              </Button>
            )}
            
            <ModeToggle />
            
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {!isAdmin && navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "block py-2 text-base font-medium transition-colors hover:text-primary",
                  isActive(item.href) ? "text-primary" : "text-muted-foreground"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {isAdmin && (
              <span className="block py-2 text-base font-medium text-primary">Admin Portal</span>
            )}
            
            {!isAdmin && (
              <>
                <div className="pt-4 border-t">
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/my-booking" onClick={() => setMobileMenuOpen(false)}>
                      <Search className="h-4 w-4 mr-2" />
                      Find Booking
                    </Link>
                  </Button>
                </div>
                
                <Button asChild className="w-full justify-start">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}