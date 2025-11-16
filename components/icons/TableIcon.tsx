import { SVGProps } from "react";
type Props = SVGProps<SVGSVGElement>;

const TableIcon = ({ className, ...props }: Props) => (
  <svg
    aria-hidden="true"
    width="40"
    height="40"
    viewBox="0 0 500 500"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeLinejoin="round"
    strokeWidth={12}
    {...props}
  >
    <path
      strokeLinecap="round"
      d="M260.89,259.27v114.99c0,5.01-4.88,9.08-10.89,9.08h0c-6.02,0-10.89-4.06-10.89-9.08v-138.76"
    />
    <line
      strokeLinecap="round"
      x1={102.42}
      y1={173.41}
      x2={102.42}
      y2={189.13}
    />
    <g>
      <path
        strokeLinecap="round"
        d="M397.58,189.13c0,25.61-66.07,46.36-147.58,46.36s-147.58-20.76-147.58-46.36"
      />
      <path
        strokeLinecap="round"
        d="M343.06,112.89c33.27,8.5,54.52,21.46,54.52,35.99,0,25.61-66.07,46.36-147.58,46.36s-147.58-20.76-147.58-46.36,66.07-46.36,147.58-46.36c20.62,0,40.24,1.33,58.07,3.73"
      />
      <line
        strokeLinecap="round"
        x1={397.57}
        y1={148.92}
        x2={397.57}
        y2={189.13}
      />
    </g>
    <path d="M260.89,364.88c12.65,2.31,21.71,8.52,21.71,15.82,0,9.27-14.59,16.78-32.6,16.78s-32.6-7.51-32.6-16.78c0-7.3,9.06-13.51,21.71-15.82" />
  </svg>
);

export default TableIcon;
