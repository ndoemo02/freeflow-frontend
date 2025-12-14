import { useEffect, useRef } from "react";
import styles from "./MotionBackground.module.css";

export default function MotionBackground() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let x = 0;
    let y = 0;

    const onMove = (e: MouseEvent) => {
      x = (e.clientX / window.innerWidth - 0.5) * 10;
      y = (e.clientY / window.innerHeight - 0.5) * 10;

      if (bgRef.current) {
        bgRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.05)`;
      }
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return <div ref={bgRef} className={styles.motionBg} />;
}
