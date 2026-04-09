"use client";
import { X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type ResponsiveDialogContextType = {
  isDesktop: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  canClose?: boolean;
  allowOutsideClick?: boolean;
};

const ResponsiveDialogContext =
  React.createContext<ResponsiveDialogContextType | null>(null);

const useResponsiveDialog = () => {
  const context = React.useContext(ResponsiveDialogContext);
  if (!context) {
    throw new Error(
      "useResponsiveDialog must be used within a ResponsiveDialog",
    );
  }
  return context;
};

const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

const useIsDesktop = () => {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const updateMatch = () => setMatches(mediaQuery.matches);

    updateMatch();
    mediaQuery.addEventListener("change", updateMatch);
    return () => mediaQuery.removeEventListener("change", updateMatch);
  }, []);

  return matches;
};

interface ResponsiveDialogProps {
  trigger?: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  className?: string;
  canClose?: boolean;
  allowOutsideClick?: boolean;
}

const ResponsiveDialog = ({
  trigger,
  children,
  open,
  onOpenChange,
  size,
  className,
  canClose = true,
  allowOutsideClick = true,
}: ResponsiveDialogProps) => {
  const isDesktop = useIsDesktop();
  const dialogWidthClass = size
    ? {
        sm: "sm:max-w-sm",
        md: "sm:max-w-md",
        lg: "sm:max-w-lg",
        xl: "sm:max-w-xl",
        "2xl": "sm:max-w-2xl",
        "3xl": "sm:max-w-3xl",
        full: "sm:max-w-[calc(100%-2rem)]",
      }[size]
    : undefined;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !canClose) {
        return;
      }
      onOpenChange(nextOpen);
    },
    [canClose, onOpenChange],
  );

  return (
    <ResponsiveDialogContext.Provider
      value={{
        isDesktop,
        isOpen: open,
        onOpenChange,
        size,
        canClose,
        allowOutsideClick,
      }}
    >
      {isDesktop ? (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          {trigger != null && <DialogTrigger>{trigger}</DialogTrigger>}

          <DialogContent
            showCloseButton={false}
            className={cn("flex flex-col p-4", dialogWidthClass, className)}
          >
            {children}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer
          open={open}
          onOpenChange={handleOpenChange}
          dismissible={canClose && allowOutsideClick}
        >
          {trigger != null && <DrawerTrigger>{trigger}</DrawerTrigger>}

          <DrawerContent
            className={cn(
              // More vertical room on phones than default 80vh + mt-24 (share / invite content).
              "data-[vaul-drawer-direction=bottom]:mt-14 data-[vaul-drawer-direction=bottom]:max-h-[min(92dvh,880px)]",
              className,
            )}
          >
            {children}
          </DrawerContent>
        </Drawer>
      )}
    </ResponsiveDialogContext.Provider>
  );
};

interface HeaderProps {
  children: React.ReactNode;
  className?: string;
}

const Header = ({ children, className }: HeaderProps) => {
  const { isDesktop, canClose, onOpenChange } = useResponsiveDialog();

  if (isDesktop) {
    return (
      <DialogHeader className={cn("relative  pb-5", className)}>
        {children}
        {canClose && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-0 right-0 h-6 w-6 p-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}
      </DialogHeader>
    );
  }

  return (
    <DrawerHeader
      className={cn(
        "text-left justify-start self-start pb-3 pt-1",
        className,
      )}
    >
      {children}
    </DrawerHeader>
  );
};

interface TitleProps {
  children: React.ReactNode;
  className?: string;
}

interface TriggerProps {
  children: React.ReactNode;
}

const Trigger = ({ children }: TriggerProps) => {
  const { isDesktop } = useResponsiveDialog();

  if (isDesktop) {
    return <DialogTrigger>{children}</DialogTrigger>;
  }
  return <DrawerTrigger>{children}</DrawerTrigger>;
};

const Title = ({ children, className }: TitleProps) => {
  const { isDesktop } = useResponsiveDialog();

  if (isDesktop) {
    return <DialogTitle className={className}>{children}</DialogTitle>;
  }

  return (
    <DrawerTitle className={cn("justify-start self-start", className)}>
      {children}
    </DrawerTitle>
  );
};

interface DescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const Description = ({ children, className }: DescriptionProps) => {
  const { isDesktop } = useResponsiveDialog();

  if (!isDesktop) {
    return <DrawerDescription className={className}>{children}</DrawerDescription>;
  }

  return (
    <DialogDescription className={className}>{children}</DialogDescription>
  );
};

interface ContentProps {
  children: React.ReactNode;
  className?: string;
}

const Content = ({ children, className }: ContentProps) => {
  const { isDesktop } = useResponsiveDialog();

  if (isDesktop) {
    return (
      <div className={cn("overflow-y-auto p-1", className)}>{children}</div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-contain px-4",
        "pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]",
        className,
      )}
    >
      {children}
    </div>
  );
};

interface FooterProps {
  children: React.ReactNode;
  className?: string;
}

const Footer = ({ children, className }: FooterProps) => {
  const { isDesktop } = useResponsiveDialog();

  if (isDesktop) {
    return (
      <DialogFooter>
        <div className="flex w-full flex-col gap-2">
          <Separator className="my-2 w-full" />
          <div
            className={cn(
              "flex w-full flex-col gap-3 sm:flex-row sm:justify-end sm:gap-3",
              "[&_[data-slot=button]]:min-h-14 [&_[data-slot=button]]:shrink-0 [&_[data-slot=button]]:px-6 [&_[data-slot=button]]:text-base [&_[data-slot=button]]:font-bold",
              className,
            )}
          >
            {children}
          </div>
        </div>
      </DialogFooter>
    );
  }

  return (
    <DrawerFooter
      className={cn(
        "shrink-0 flex-col-reverse justify-end gap-3 px-4 pt-2",
        "pb-[max(1rem,env(safe-area-inset-bottom,0px))]",
        "[&_[data-slot=button]]:min-h-14 [&_[data-slot=button]]:shrink-0 [&_[data-slot=button]]:px-6 [&_[data-slot=button]]:text-base [&_[data-slot=button]]:font-bold",
        className,
      )}
    >
      {children}
    </DrawerFooter>
  );
};

interface CloseProps {
  children?: React.ReactNode;
  className?: string;
}

const Close = ({ children, className }: CloseProps) => {
  const { isDesktop, canClose } = useResponsiveDialog();

  if (!canClose) {
    return null;
  }

  if (isDesktop) {
    return <DialogClose className={className}>{children}</DialogClose>;
  }

  return <DrawerClose className={className}>{children}</DrawerClose>;
};

ResponsiveDialog.Header = Header;
ResponsiveDialog.Title = Title;
ResponsiveDialog.Description = Description;
ResponsiveDialog.Content = Content;
ResponsiveDialog.Footer = Footer;
ResponsiveDialog.Trigger = Trigger;
ResponsiveDialog.Close = Close;

export { ResponsiveDialog };
