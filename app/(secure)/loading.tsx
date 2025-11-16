import React from "react";

const loading = () => {
  return (
    <div className="absolute left-1 top-1 z-0 rounded-md w-[98%] lg:w-[99.4%] h-[64px] overflow-hidden">
      <div className="loadingDiv"></div>
    </div>
  );
};

export default loading;
