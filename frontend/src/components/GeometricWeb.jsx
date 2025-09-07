import React, { useEffect, useRef } from 'react';

const GeometricWeb = () => {
  const canvasRef = useRef(null);
  const dots = useRef([]);
  const animationFrameId = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Resize the canvas to fit the window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Initialize dots with random positions and velocities
    const initDots = () => {
      dots.current = [];
      const numDots = 100;
      for (let i = 0; i < numDots; i++) {
        dots.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5, // Random velocity for x
          vy: (Math.random() - 0.5) * 0.5, // Random velocity for y
        });
      }
    };

    // Draw the web and animate the dots
    const drawWeb = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw each dot
      dots.current.forEach(dot => {
        dot.x += dot.vx;
        dot.y += dot.vy;
        
        // Bounce off canvas edges
        if (dot.x < 0 || dot.x > canvas.width) dot.vx *= -1;
        if (dot.y < 0 || dot.y > canvas.height) dot.vy *= -1;
        
        // Draw dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34, 197, 94, 3)'; // Dot color
        ctx.fill();
      });
      
      // Draw connections between dots if they are close enough
      dots.current.forEach((dot1, i) => {
        dots.current.slice(i + 1).forEach(dot2 => {
          const distance = Math.hypot(dot1.x - dot2.x, dot1.y - dot2.y);
          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(dot1.x, dot1.y);
            ctx.lineTo(dot2.x, dot2.y);
            const opacity = 1 - (distance / 150); // Fade connections with distance
            ctx.strokeStyle = `rgba(34, 197, 94, ${opacity})`; // Connection color
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
      });

      animationFrameId.current = requestAnimationFrame(drawWeb); // Continue the animation
    };

    // Add resize listener
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Set initial canvas size
    initDots(); // Initialize the dots
    drawWeb(); // Start drawing the web

    // Cleanup function when component unmounts
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current); // Stop animation
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ opacity: 0.3 }} // Set canvas opacity
    />
  );
};

export default GeometricWeb;
