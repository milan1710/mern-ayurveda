// store/src/components/MetaPixel.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initPixel, trackPageView } from '../lib/pixel';

const PIXEL_ID = import.meta.env.VITE_FACEBOOK_PIXEL_ID;

export default function MetaPixel(){
  const location = useLocation();

  useEffect(() => {
    if (PIXEL_ID) initPixel(PIXEL_ID);
  }, []);

  useEffect(() => {
    // हर route change पर
    trackPageView();
  }, [location.pathname, location.search]);

  // 1px noscript fallback (optional)
  return (
    <noscript>
      {PIXEL_ID ? (
        <img
          height="1"
          width="1"
          style={{ display:'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      ) : null}
    </noscript>
  );
}
