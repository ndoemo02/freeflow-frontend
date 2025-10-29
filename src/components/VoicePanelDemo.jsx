import { useEffect, useRef } from "react";
import gsap from "gsap";

/** Pure demo of minimal HTML + CSS + GSAP interactions for the voice panel. */
export default function VoicePanelDemo() {
  const containerRef = useRef(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const tab = root.querySelector('.voice-tab');
    const panel = root.querySelector('.voice-panel');
    const tiles = root.querySelectorAll('.tile');
    let open = false;

    const onClick = () => {
      open = !open;
      panel.classList.toggle('active', open);

      if (open) {
        gsap.to(tiles, { y: 70, opacity: 0, filter: 'blur(4px)', duration: 0.6, ease: 'power2.inOut', stagger: 0.05 });
        gsap.to(root.querySelector('.logo'), { scale: 0.95, opacity: 0.8, duration: 0.4 });
      } else {
        gsap.to(tiles, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power2.inOut', stagger: 0.05 });
        gsap.to(root.querySelector('.logo'), { scale: 1, opacity: 1, duration: 0.4 });
      }
    };

    tab?.addEventListener('click', onClick);
    return () => tab?.removeEventListener('click', onClick);
  }, []);

  return (
    <div ref={containerRef} className="ff-gsap-demo">
      <div className="main-container">
        <div className="logo">FreeFlow</div>

        <div className="tiles">
          <div className="tile">🍔</div>
          <div className="tile">🚕</div>
          <div className="tile">🏨</div>
        </div>

        <div className="voice-panel">
          <svg className="electric-border" viewBox="0 0 400 140" preserveAspectRatio="none">
            <rect x="5" y="5" width="390" height="130" rx="25" ry="25" />
          </svg>

          <div className="voice-tab">🖋️</div>
          <div className="panel-content">
            <div className="input-placeholder">
              <span className="cursor"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}





