import { useEffect } from "react";
import styles from "./MotionBackground.module.css";

export function MotionBackground() {
  useEffect(() => {
    const el = document.getElementById("motion-bg");
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      // Wyłączamy animację CSS gdy ruszymy myszką, aby JS przejął kontrolę płynnie?
      // Albo po prostu nadpisujemy transform.
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      el.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
    };

    // Tylko na desktopach (gdzie jest mysz)
    // matchMedia('(pointer: fine)').matches ?
    window.addEventListener("mousemove", handleMove);

    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return <div id="motion-bg" className={styles.motionBg} />;
}
