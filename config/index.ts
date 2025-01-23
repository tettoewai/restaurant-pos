interface Config {
  googleClientId: string;
  googleClientSecret: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  orderAppUrl: string;
  digitalReceiptUrl: string;
}

export const config: Config = {
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  orderAppUrl: process.env.NEXT_PUBLIC_ORDER_APP_URL || "",
  digitalReceiptUrl: process.env.NEXT_PUBLIC_DIGITAL_RECEIPT_URL || "",
};
