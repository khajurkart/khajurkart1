import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        const container = document.querySelector(".your-scroll-container");

        if (container) {
            container.scrollTo(0, 0);
        } else {
            window.scrollTo(0, 0);
        }
    }, [pathname]);

    return null;
}

export default ScrollToTop;
