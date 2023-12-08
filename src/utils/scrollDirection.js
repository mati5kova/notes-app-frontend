import { useEffect, useState } from 'react';

export default function useScrollDirection() {
    const [scrollDirection, setScrollDirection] = useState('up');
    const [scrollTimeout, setScrollTimeout] = useState(null);

    useEffect(() => {
        let lastScrollY = window.scrollY;

        const updateScrollDirection = () => {
            const scrollY = window.scrollY;
            const direction = scrollY > lastScrollY ? 'down' : 'up';
            if (direction !== scrollDirection && (scrollY - lastScrollY > 1 || scrollY - lastScrollY < -1)) {
                setScrollDirection(direction);
                clearTimeout(scrollTimeout); // Clear any existing timeout
                if (direction === 'down') {
                    // Set a new timeout to change direction to 'up' after 1000 milliseconds (1 second)
                    const newScrollTimeout = setTimeout(() => {
                        setScrollDirection('up');
                    }, 800);
                    setScrollTimeout(newScrollTimeout);
                }
            }

            lastScrollY = scrollY > 0 ? scrollY : 0;
        };

        window.addEventListener('scroll', updateScrollDirection); // add event listener
        return () => {
            window.removeEventListener('scroll', updateScrollDirection); // clean up
            clearTimeout(scrollTimeout); // Clear the timeout on unmount
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scrollDirection]);

    return scrollDirection;
}
