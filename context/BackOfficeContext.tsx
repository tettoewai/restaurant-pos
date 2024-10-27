"use client";

import { OrderData, PaidData } from "@/general";
import React, {
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  ReactNode,
} from "react";

// Define the shape of the context value
interface BackOfficeContextType {
  paid: PaidData[];
  setPaid: Dispatch<SetStateAction<PaidData[]>>;
}

// Create a Context with a default value of null or an initial state
export const BackOfficeContext = createContext<BackOfficeContextType>(
  {} as BackOfficeContextType
);

const BackOfficeContextProvider = ({ children }: { children: ReactNode }) => {
  const [paid, setPaid] = useState([] as PaidData[]);

  return (
    <BackOfficeContext.Provider value={{ paid, setPaid }}>
      {children}
    </BackOfficeContext.Provider>
  );
};

export default BackOfficeContextProvider;
