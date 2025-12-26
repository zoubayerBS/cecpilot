import { useEffect, useRef } from 'react';

export function useUnsavedChanges(isDirty: boolean) {
  const isDirtyRef = useRef(isDirty);

  // Keep the ref updated with the latest isDirty value
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;

    // 1. Handle Browser Close / Refresh / Tab Close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Standard for Chrome/Firefox
    };

    // 2. Handle Back Button / Trackpad Swipe (History Traversal)
    // We push a "dummy" state to the history stack. 
    // When the user swipes back, they pop this state but stay on the same URL visually.
    // This gives us a chance to show a confirmation dialog.
    window.history.pushState(null, '', window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      if (isDirtyRef.current) {
        const message = "Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter cette page ?";
        if (window.confirm(message)) {
          // User confirmed they want to leave.
          // We are currently at the history state *before* the trap (because the pop happened).
          // We disable the check to allow the *next* navigation (which we trigger manually) to proceed.
          isDirtyRef.current = false;
          // Go back again to actually leave the page (navigate to the previous route)
          window.history.back();
        } else {
          // User canceled (wants to stay).
          // The history state was popped. We must push it again to re-arm the trap.
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    // 3. Handle Internal Links (Sidebar, Navigation)
    // Intercept clicks on anchor tags to prevent client-side routing
    const handleClick = (e: MouseEvent) => {
        if (isDirtyRef.current) {
            const target = (e.target as HTMLElement).closest('a');
            // Check if it's a link, has an href, and isn't opening in a new tab
            if (target && (target as HTMLAnchorElement).href && !target.getAttribute('target')) {
                const message = "Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter cette page ?";
                if (!window.confirm(message)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleClick, true); // Capture phase to intervene early

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClick, true);
    };
  }, [isDirty]);
}