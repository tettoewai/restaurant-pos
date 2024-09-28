"use client";
import { Card } from "@nextui-org/react";
import { Table } from "@prisma/client";
import { Bebas_Neue } from "next/font/google";
import Image from "next/image";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });

const QrcodePrint = ({ table }: { table?: Table }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "QR Code Card",
  });

  const handleClick = () => {
    if (!table?.assetUrl || !table?.name) {
      alert("Invalid QR code data. Cannot print.");
      return;
    }
    // If valid, trigger the print
    handlePrint();
  };
  return (
    <div>
      <div className="hidden">
        <Card
          ref={componentRef}
          className="bg-background w-[336px] h-[672px] flex items-center justify-between"
        >
          <div className="flex flex-col items-start mt-6">
            <h1 className={`${bebasNeue.className} text-lg`}>Welcome from</h1>
            <h1 className={`${bebasNeue.className} text-2xl`}>TTW FOODIE</h1>
          </div>

          <div className="flex flex-col items-center relative">
            <h4 className={bebasNeue.className}>Scan here to place order</h4>
            <div className="size-[250px] absolute top-5">
              <svg
                version="1.1"
                id="Layer_1"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                x="0px"
                y="0px"
                viewBox="0 0 400 400"
                xmlSpace="preserve"
              >
                <style type="text/css">{`.st0{fill:#ED2024;}`}</style>
                <g>
                  <g>
                    <path
                      className="st0"
                      d="M68.81,365.89c-7.44,0-14.87,0.03-22.31,0c-6.27-0.02-11.87-4.71-12.35-11.12c-0.26-3.54-0.04-7.16-0.04-10.7
			c0-4.13,0-8.26,0-12.39c0-2.07-3.22-2.08-3.22,0c0,7.35-0.08,14.7,0,22.05c0.08,7.77,5.92,14.36,13.65,15.28
			c1.39,0.16,2.81,0.11,4.2,0.11c2.35,0,4.71,0,7.06,0c4.33,0,8.67,0,13,0C70.88,369.11,70.88,365.89,68.81,365.89L68.81,365.89z"
                    />
                  </g>
                </g>
                <g>
                  <g>
                    <path
                      className="st0"
                      d="M365.89,331.68c0,7.28,0.03,14.56,0,21.84c-0.03,6.22-4.63,11.73-10.95,12.31
			c-3.46,0.32-7.04,0.05-10.51,0.05c-4.09,0-8.18,0-12.27,0c-2.07,0-2.08,3.22,0,3.22c7.24,0,14.49,0.12,21.73,0
			c7.6-0.12,14.1-5.89,15.07-13.44c0.47-3.67,0.14-7.55,0.14-11.23c0-4.25,0-8.5,0-12.76C369.11,329.61,365.89,329.6,365.89,331.68
			L365.89,331.68z"
                    />
                  </g>
                </g>
                <g>
                  <g>
                    <path
                      className="st0"
                      d="M34.11,68.32c0-7.32-0.06-14.64,0-21.95c0.06-6.73,5.41-12.18,12.16-12.25c3.42-0.04,6.85,0,10.27,0
			c4.09,0,8.17,0,12.26,0c2.07,0,2.08-3.22,0-3.22c-7.5,0-15-0.07-22.5,0c-7.28,0.07-13.87,5.28-15.15,12.55
			c-0.29,1.63-0.27,3.24-0.27,4.88c0,2.29,0,4.58,0,6.88c0,4.37,0,8.75,0,13.12C30.89,70.39,34.11,70.4,34.11,68.32L34.11,68.32z"
                    />
                  </g>
                </g>
                <g>
                  <g>
                    <path
                      className="st0"
                      d="M332.17,34.11c7.16,0,14.32-0.06,21.48,0c6.61,0.06,12.13,5.31,12.24,11.99c0.06,3.36,0,6.72,0,10.08
			c0,4.05,0,8.09,0,12.14c0,2.07,3.22,2.08,3.22,0c0-7.34,0.08-14.68,0-22.02c-0.07-7.22-5.2-13.76-12.39-15.11
			c-1.64-0.31-3.27-0.3-4.93-0.3c-2.25,0-4.5,0-6.74,0c-4.29,0-8.59,0-12.88,0C330.1,30.89,330.09,34.11,332.17,34.11L332.17,34.11z
			"
                    />
                  </g>
                </g>
              </svg>
            </div>
            <div>
              {table?.assetUrl && (
                <Image
                  src={table?.assetUrl}
                  alt="qr code"
                  width={240}
                  height={240}
                />
              )}
            </div>
          </div>
          <div className="mb-10">
            {table?.name && <span>Table: {table?.name}</span>}
          </div>
        </Card>
      </div>
      <button onClick={handleClick}>Print qr</button>
    </div>
  );
};

export default QrcodePrint;
