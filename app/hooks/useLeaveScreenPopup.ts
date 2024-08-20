import { useState, useEffect } from "react";

export default function useLeaveScreenPopup() {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (event: { preventDefault: () => void; returnValue: string }) => {
      if (hasUnsavedChanges) {
        // Standard way to trigger the confirmation dialog
        event.preventDefault();
        // Chrome requires returnValue to be set
        event.returnValue = "";
      }
    };
    // Attach the event listener
    window.addEventListener("beforeunload", handleBeforeUnload);
    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  return { setHasUnsavedChanges };
}
