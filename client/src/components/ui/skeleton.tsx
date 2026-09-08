

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
     className={`relative overflow-hidden rounded-md bg-slate-200/80 before:absolute 
        before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] 
        before:bg-gradient-to-r 
        before:from-transparent 
        before:via-white/40 before:to-transparent motion-reduce:animate-none motion-reduce:before:animate-none
        dark:bg-slate-800/80 dark:before:via-white/10
        ${className}`}
      {...props}
    />
  )
}

export { Skeleton }
