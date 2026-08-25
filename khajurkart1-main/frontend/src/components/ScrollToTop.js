import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // ✅ Instant scroll on refresh/mount — no smooth behavior fight
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
