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

export const convert12Hour = (time: string) => {
  const [hour, minute] = time.split(":");

  const hourNumber = parseInt(hour, 10);
  const period = hourNumber >= 12 ? "PM" : "AM";
  const hour12 = hourNumber % 12 || 12;

  return `${hour12}:${minute} ${period}`;
};

export function checkArraySame(
  array1: number[] | string[],
  array2: number[] | string[]
) {
  if (array1.length !== array2.length) {
    return false;
  }

  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) {
      return false;
    }
  }
  return true;
}
