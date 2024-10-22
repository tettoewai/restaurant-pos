import React from "react";

interface BackdropProps {
  onClick: () => void;
}

const Backdrop: React.FC<BackdropProps> = ({ onClick }) => {
  return (
    <div
      className="transition-opacity fixed inset-0 bg-black bg-opacity-35 z-20 md:hidden"
      onClick={onClick}
    />
  );
};

export default Backdrop;
