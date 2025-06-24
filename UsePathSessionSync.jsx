import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

export const UsePathSessionSync = ({ excludedPaths, sessionKey }) => {
  const location = useLocation();
  const prevPageRef = useRef(location.pathname);

  useEffect(() => {
    const currentPage = location.pathname;
    const prevPage = prevPageRef.current;

    const isExcluded = excludedPaths.some((path) =>
      currentPage.startsWith(path)
    );
    const wasExcluded = excludedPaths.some((path) => prevPage.startsWith(path));

    if (!wasExcluded && isExcluded) {
      sessionStorage.setItem(sessionKey, '1');
      console.log(`[${sessionKey}] Entered tracked path → set to 1`);
    } else if (wasExcluded && !isExcluded) {
      sessionStorage.removeItem(sessionKey);
      console.log(`[${sessionKey}] Left tracked path → removed`);
    }

    prevPageRef.current = currentPage;
  }, [location.pathname, excludedPaths, sessionKey]);
};
