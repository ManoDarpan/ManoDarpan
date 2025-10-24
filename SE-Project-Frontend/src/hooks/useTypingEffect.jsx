import { useEffect } from 'react';
export function useTypingEffect(ref, text, speed = 100) {
  useEffect(() => {
    if (!ref?.current) return;
    const el = ref.current;
    el.textContent = '';
    let i = 0;
    let cancelled = false;
    el.classList.add('typing-cursor');
    const tick = () => {
      if (cancelled) return;
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(tick, speed);
      }else{
        el.classList.remove('typing-cursor');
      }
    };
    tick();
    return () => { cancelled = true; };
  }, [ref, text, speed]);
}