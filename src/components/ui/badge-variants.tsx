
import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: 
          "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        warning:
          "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        info:
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        purple:
          "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
        pink:
          "border-transparent bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
        gradient:
          "border-transparent bg-gradient-to-r from-indigo-500 to-purple-500 text-white",
        glossy:
          "border border-white/20 bg-white/10 backdrop-blur-sm text-white shadow-sm",
        stats:
          "border-transparent bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-3 py-1",
        new:
          "animate-pulse border-transparent bg-green-400 text-white dark:bg-green-500 dark:text-white",
        premium:
          "border-transparent bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold",
        count:
          "flex items-center justify-center h-6 min-w-6 rounded-full bg-primary/15 text-primary text-xs font-medium",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.25 text-xs",
        lg: "px-3 py-0.75 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
