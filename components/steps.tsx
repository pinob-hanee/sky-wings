"use client"

import { cn } from "@/lib/utils"

interface Step {
  id: number
  label: string
  icon: React.ReactNode
}

interface StepsProps {
  steps: Step[]
  currentStep: number
}

export function Steps({ steps, currentStep }: StepsProps) {
  return (
    <div className="w-full">
      <div className="relative flex justify-between items-center w-full">
        {steps.map((step, index) => (
          <div key={step.id} className="relative flex flex-col items-center w-full">
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="absolute top-5 left-1/2 w-full h-[2px] -z-10">
                <div 
                  className={cn(
                    "h-full w-full transition-all duration-300",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )}
                />
              </div>
            )}

            {/* Step Circle */}
            <div 
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium transition-all duration-300",
                currentStep >= step.id 
                  ? "bg-primary text-primary-foreground shadow-lg" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step.icon}
            </div>

            {/* Step Label */}
            <p className={cn(
              "text-sm mt-2 transition-all duration-300",
              currentStep >= step.id 
                ? "text-foreground font-medium" 
                : "text-muted-foreground"
            )}>
              {step.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
