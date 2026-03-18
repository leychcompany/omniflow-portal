import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md",
        outline:
          "border border-gray-300 dark:border-white/[0.12] bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-zinc-100 shadow-sm hover:shadow-md",
        secondary:
          "bg-gray-100 dark:bg-white/[0.08] text-gray-900 dark:text-zinc-100 hover:bg-gray-200 dark:hover:bg-white/[0.12] shadow-sm",
        ghost: "hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-zinc-100",
        link: "text-red-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-md px-4",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
