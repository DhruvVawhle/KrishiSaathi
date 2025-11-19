import React from "react";
import sprite from "/src/assets/veggie-sprite.png";   // <-- FIXED PATH

const VeggieIcon = ({ x, y, size = 70 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${sprite})`,
        backgroundSize: "500% 500%",
        backgroundPosition: `${x}% ${y}%`,
      }}
      className="rounded-full"
    />
  );
};

export default VeggieIcon;
