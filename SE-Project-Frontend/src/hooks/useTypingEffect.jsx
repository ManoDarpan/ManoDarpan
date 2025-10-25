import { useEffect } from 'react';

/**
 * Custom React hook to implement a typing effect on a DOM element.
 * It progressively displays text in the target element with a set speed.
 * * @param {object} ref - A React ref object pointing to the DOM element (e.g., div, p, span).
 * @param {string} text - The full string of text to be typed out.
 * @param {number} [speed=100] - The delay in milliseconds between typing each character.
 */
export function useTypingEffect(ref, text, speed = 100) {
  useEffect(() => {
    if (!ref?.current) return; // Exit if the ref or its current element is null
    const el = ref.current; // Get the target DOM element
    el.textContent = ''; // Clear existing text content
    let i = 0; // Character index counter
    let cancelled = false; // Flag for effect cleanup
    
    el.classList.add('typing-cursor'); // Add a class to show a blinking cursor effect
    
    const tick = () => {
      if (cancelled) return; // Stop if the component unmounted or effect reran
      
      if (i < text.length) {
        el.textContent += text.charAt(i); // Append the next character
        i++;
        setTimeout(tick, speed); // Schedule the next character type
      }else{
        el.classList.remove('typing-cursor'); // Remove the cursor once typing is complete
      }
    };
    
    tick(); // Start the typing process
    
    return () => { 
      cancelled = true; // Cleanup: prevent scheduled timeouts from executing on unmount/rerun
    };
  }, [ref, text, speed]); // Dependencies: reruns when ref, text, or speed changes
}
