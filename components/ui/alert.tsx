type AlertProps = {
    children: React.ReactNode;
    variant?: 'default' | 'destructive';
    className?: string;
  }
  
  export function Alert({ children, variant = 'default', className = '' }: AlertProps) {
    const baseStyles = "px-4 py-3 rounded-lg border";
    const variantStyles = {
      default: "bg-blue-50 border-blue-200 text-blue-800",
      destructive: "bg-red-50 border-red-200 text-red-800"
    };
  
    return (
      <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
        {children}
      </div>
    );
  }
  
  export function AlertTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <h5 className={`font-medium mb-1 ${className}`}>{children}</h5>;
  }

  export function AlertDescription({ children }: { children: React.ReactNode }) {
    return <div className="text-sm font-medium">{children}</div>;
  }