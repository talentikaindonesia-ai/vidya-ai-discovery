import { createContext, useContext, useState, ReactNode } from "react";
import { UpgradeModal } from "@/components/UpgradeModal";

interface UpgradeModalCtx {
  openUpgradeModal: () => void;
}

const UpgradeModalContext = createContext<UpgradeModalCtx>({
  openUpgradeModal: () => {},
});

export const useUpgradeModal = () => useContext(UpgradeModalContext);

export const UpgradeModalProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <UpgradeModalContext.Provider value={{ openUpgradeModal: () => setOpen(true) }}>
      {children}
      <UpgradeModal open={open} onClose={() => setOpen(false)} />
    </UpgradeModalContext.Provider>
  );
};
