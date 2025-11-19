// src/components/HeroSlider.jsx
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Combined Hero Styles:
 *  ✓ Modern (clean transitions, soft zoom)
 *  ✓ Cinematic (parallax, atmospheric layering)
 *  ✓ Minimal (optimized + low CPU)
 */

const farmerImages = [
  "https://www.atlanticcouncil.org/wp-content/uploads/2020/09/An-Indian-farmer-in-a-field-scaled.jpg",
  "https://media.istockphoto.com/id/1284379612/photo/indian-farmer-spreading-fertilizer-in-the-green-banana-field.jpg?b=1&s=170667a&w=0&k=20&c=mvNit1p2oeb2DDK6Bf-zx-c9Et8mmQFtLRGFmsoYeVk=",
  "https://media.istockphoto.com/id/1496400775/photo/indian-serious-farmer-checking-crop-growth-at-greenhouse-concept-of-farming-cultivation-and.jpg?s=612x612&w=0&k=20&c=IPWFeiWQmG3h80PRoHd4dG7DMrxrwpi1T7gL7s5NvIs=",
  "https://i1.wp.com/www.learncram.com/wp-content/uploads/2021/07/Farming-in-India.jpg?resize=798%2C596&ssl=1",
];

const HeroSlider = () => {
  const [index, setIndex] = useState(0);

  // Slider interval — no re-renders except on change
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % farmerImages.length);
    }, 5500);
    return () => clearInterval(interval);
  }, []);

  // Parallax effect (minimal CPU, event throttled)
  const parallaxY = useRef(0);
  const [yPos, setYPos] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleMove = (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const move = e.clientY / 80; // cinematic subtle movement
          parallaxY.current = move;
          setYPos(move);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
        >
          <motion.img
            src={farmerImages[index]}
            alt="Farmer"
            className="w-full h-full object-cover"
            style={{
              y: yPos, // cinematic parallax
            }}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 5.5, ease: "linear" }} // subtle zoom
          />
        </motion.div>
      </AnimatePresence>

      {/* 🔥 LAYERED GRADIENTS → Super readable text */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top cinematic fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/50"></div>

        {/* Lateral cinematic fade edges */}
        <div className="absolute left-0 top-0 h-full w-32 bg-gradient-to-r from-black/40 to-transparent"></div>
        <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-black/40 to-transparent"></div>

        {/* Bottom fog layer */}
        <div className="absolute bottom-0 h-48 w-full bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>
    </div>
  );
};

export default HeroSlider;
