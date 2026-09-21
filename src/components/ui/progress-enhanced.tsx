"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"
import { CheckCircle, Circle } from "lucide-react"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all duration-500 ease-in-out"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

// Enhanced Progress with steps
interface ProgressStepsProps {
  steps: string[]
  currentStep: number
  className?: string
  descriptions?: string[]
}

const ProgressSteps = React.forwardRef<HTMLDivElement, ProgressStepsProps>(
  ({ steps, currentStep, className, descriptions, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("w-full relative z-10", className)}
        {...props}
      >
        <div className="flex items-start justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep - 1;
            const isActive = index === currentStep - 1;
            const isPending = index > currentStep - 1;

            return (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center flex-1 z-10">
                  <div className="relative flex items-center justify-center mb-3">
                    {/* Active Ring Animation */}
                    {isActive && (
                      <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-spin [animation-duration:3s] opacity-20 blur-[2px]" />
                    )}
                    {isActive && (
                      <div className="absolute -inset-1 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin [animation-duration:1.5s]" />
                    )}
                    
                    <div
                      className={cn(
                        "relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full transition-all duration-500 shadow-sm z-10",
                        isCompleted
                          ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-500/20"
                          : isActive
                          ? "bg-white border-2 border-emerald-500 text-emerald-600 shadow-xl scale-110"
                          : "bg-gray-100 border-2 border-gray-200 text-gray-400"
                      )}
                      aria-current={isActive ? "step" : undefined}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 animate-in zoom-in" />
                      ) : (
                        <span className="font-bold text-sm sm:text-base">{index + 1}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-center px-1">
                    <span
                      className={cn(
                        "block text-xs sm:text-sm font-semibold transition-colors duration-300",
                        isActive ? "text-emerald-700" : isCompleted ? "text-green-700" : "text-gray-500"
                      )}
                    >
                      {step}
                    </span>
                    {descriptions && descriptions[index] && (
                      <span className="hidden sm:block mt-1 text-[10px] sm:text-xs text-gray-500 max-w-[120px] mx-auto leading-tight">
                        {descriptions[index]}
                      </span>
                    )}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 flex items-center h-12 relative px-2">
                    <div className="absolute left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden top-1/2 -translate-y-1/2 -mx-4 z-0">
                      <div 
                        className={cn(
                          "h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-1000 ease-in-out",
                          isCompleted ? "w-full" : "w-0"
                        )}
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    )
  }
)
ProgressSteps.displayName = "ProgressSteps"

// Circular Progress
interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  showValue?: boolean
}

const CircularProgress = React.forwardRef<HTMLDivElement, CircularProgressProps>(
  ({ value, size = 120, strokeWidth = 8, className, showValue = true, ...props }, ref) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDashoffset = circumference - (value / 100) * circumference

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex items-center justify-center", className)}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-muted"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-primary transition-all duration-500 ease-in-out"
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium">{Math.round(value)}%</span>
          </div>
        )}
      </div>
    )
  }
)
CircularProgress.displayName = "CircularProgress"

// Progress with label and description
interface ProgressWithLabelProps {
  value: number
  label?: string
  description?: string
  className?: string
  showPercentage?: boolean
}

const ProgressWithLabel = React.forwardRef<HTMLDivElement, ProgressWithLabelProps>(
  ({ value, label, description, className, showPercentage = true, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {(label || showPercentage) && (
          <div className="flex items-center justify-between">
            {label && <span className="text-sm font-medium">{label}</span>}
            {showPercentage && (
              <span className="text-sm text-muted-foreground">{Math.round(value)}%</span>
            )}
          </div>
        )}
        <Progress value={value} />
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    )
  }
)
ProgressWithLabel.displayName = "ProgressWithLabel"

export {
  Progress,
  ProgressSteps,
  CircularProgress,
  ProgressWithLabel,
}
