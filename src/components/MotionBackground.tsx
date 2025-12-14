import { useEffect, useRef } from "react";
import styles from "./MotionBackground.module.css";

export function MotionBackground() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      // Subtelny parallax (20px) - "wow, ale delikatnie"
      const x = (e.clientX / window.innerWidth - 0.5) * 25;
      const y = (e.clientY / window.innerHeight - 0.5) * 25;

      requestAnimationFrame(() => {
        // Skala 1.05 wystarczy, by pokryć inset -40px
        el.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
      });
    };

    // Nasłuchiwanie tylko na desktopie/urządzeniach wskazujących? 
    // Jeśli użytkownik dotknie ekranu, mousemove może nie działać tak samo, 
    // ale zostawmy to na 'mousemove'.
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return <div ref={bgRef} className={styles.motionBg} />;
}
