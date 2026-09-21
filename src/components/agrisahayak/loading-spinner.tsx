import { cn } from "@/lib/utils";
import { Loader2, Leaf, Sparkles, Zap } from "lucide-react";

export default function LoadingSpinner({ 
  message, 
  className, 
  size = "default",
  variant = "default",
  showProgress = false,
  progress = 0
}: {
  message?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "agricultural" | "sparkle" | "pulse";
  showProgress?: boolean;
  progress?: number;
}) {
  const safeProgress = Math.min(100, Math.max(0, progress));
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  const textSizeClasses = {
    sm: "text-sm",
    default: "text-base",
    lg: "text-lg"
  };

  if (variant === "agricultural") {
    return (
      <div className={cn("flex flex-col items-center justify-center w-full", className)}>
        <div className="relative mb-6">
          {/* Outer glowing rings */}
          <div className="absolute -inset-4 bg-emerald-100 rounded-full animate-ping opacity-50" style={{ animationDuration: '3s' }}></div>
          <div className="absolute -inset-2 bg-emerald-50 rounded-full animate-pulse opacity-70"></div>
          
          {/* Main spinner ring */}
          <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-emerald-100 border-t-emerald-600 border-l-emerald-600 shadow-sm z-10" style={{ animationDuration: '2s' }}></div>
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <Leaf className="h-7 w-7 text-emerald-600 animate-pulse drop-shadow-sm" style={{ animationDuration: '2s' }} />
          </div>

          {/* Scanning particle effect */}
          <div className="absolute inset-0 z-30 rounded-full overflow-hidden border border-emerald-500/20">
            <div className="h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent w-full absolute animate-[scan_2s_ease-in-out_infinite]" />
          </div>
        </div>

        {message && (
          <p className={cn("text-center text-emerald-800 font-semibold mb-2 max-w-[280px]", textSizeClasses[size])}>
            {message}
          </p>
        )}

        {showProgress && (
          <div className="w-full max-w-[280px] mt-2 bg-white/50 p-3 rounded-xl border border-emerald-100 shadow-sm backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs font-semibold text-emerald-700 mb-2 px-1">
              <span>Overall Progress</span>
              <span className="bg-emerald-100 px-2 py-0.5 rounded-full">{Math.round(safeProgress)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-green-500 h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                style={{ width: `${safeProgress}%` }}
                aria-valuenow={safeProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                role="progressbar"
              >
                <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite] -skew-x-12" />
              </div>
            </div>
          </div>
        )}

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes scan {
            0% { top: -10%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 110%; opacity: 0; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}} />
      </div>
    );
  }

  if (variant === "sparkle") {
    return (
      <div className={cn("flex flex-col items-center justify-center p-4", className)}>
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1">
            <Sparkles className="h-3 w-3 text-primary animate-bounce" />
          </div>
        </div>
        {message && (
          <p className={cn("mt-4 text-center text-primary font-medium", textSizeClasses[size])}>
            {message}
          </p>
        )}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex flex-col items-center justify-center p-4", className)}>
        <div className="relative">
          <div className="animate-pulse rounded-full h-12 w-12 bg-primary/20"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>
        {message && (
          <p className={cn("mt-4 text-center text-primary font-medium animate-pulse", textSizeClasses[size])}>
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center p-2", className)}>
      <Loader2 className={cn("animate-spin text-current", sizeClasses[size])} />
      {message && (
        <p className={cn("ml-3 text-current", textSizeClasses[size])}>
          {message}
        </p>
      )}
    </div>
  );
}
