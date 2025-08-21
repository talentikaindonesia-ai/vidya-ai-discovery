import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-dark shadow-soft transition-smooth",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-soft",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-primary text-white hover:shadow-floating transform hover:scale-[1.02] transition-smooth border-0",
        soft: "bg-gradient-secondary text-foreground hover:shadow-accent transition-smooth border border-secondary/20",
        elegant: "bg-white text-foreground border border-input hover:bg-secondary-light hover:border-secondary transition-smooth shadow-soft",
        floating: "bg-card text-card-foreground shadow-floating hover:shadow-card border border-primary/20 hover:bg-primary-light/20 transition-smooth"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        hero: "h-12 px-8 py-3 text-base font-semibold"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);