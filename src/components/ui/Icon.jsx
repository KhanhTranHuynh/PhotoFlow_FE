import React from "react";
import { Icon } from "@iconify/react";
const Icons = ({ icon, className = "", width, rotate, hFlip, vFlip, color }) => {
  const finalClass = `inline-block ${className}`.trim();
  const props = {
    width,
    rotate,
    hFlip,
    vFlip,
    icon,
    className: finalClass,
  };
  if (color) props.color = color;

  return <Icon {...props} />;
};

export default Icons;
