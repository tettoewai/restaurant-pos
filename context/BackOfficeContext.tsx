"use client";

import { OrderData } from "@/Generial";
import React, {
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  ReactNode,
} from "react";

// Define the shape of the context value
interface BackOfficeContextType {
  paid: OrderData[];
  setPaid: Dispatch<SetStateAction<OrderData[]>>;
}

// Create a Context with a default value of null or an initial state
export const BackOfficeContext = createContext<BackOfficeContextType>(
  {} as BackOfficeContextType
);

const BackOfficeContextProvider = ({ children }: { children: ReactNode }) => {
  const [paid, setPaid] = useState([] as OrderData[]);

  return (
    <BackOfficeContext.Provider value={{ paid, setPaid }}>
      {children}
    </BackOfficeContext.Provider>
  );
};

export default BackOfficeContextProvider;
