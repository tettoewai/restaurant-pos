export const dateToString = ({
  date,
  type,
}: {
  date: Date;
  type: "DMY" | "YMD";
}) => {
  const dayDate =
    date.getDate() < 10 ? "0" + String(date.getDate()) : date.getDate();
  const month =
    date.getMonth() + 1 < 10
      ? "0" + String(date.getMonth() + 1)
      : date.getMonth() + 1;
  return type === "DMY"
    ? dayDate + "-" + month + "-" + date.getFullYear()
    : date.getFullYear() + "-" + month + "-" + dayDate;
};

export const formatCurrency = (value: number) => {
  return (
    new Intl.NumberFormat("en-MM", {
      minimumFractionDigits: 0, // Ensures no decimals
    }).format(value) + " Ks"
  );
};
