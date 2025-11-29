import { fetchTableWithId } from "@/app/lib/backoffice/data";
import { fetchCompanyFromOrder } from "@/app/lib/order/data";
import { Card, Divider } from "@heroui/react";
import { UsersGroupTwoRounded } from "@solar-icons/react/ssr";

export const revalidate = 60;

export default async function AboutUsPage({
  searchParams,
}: {
  searchParams: { tableId: string };
}) {
  const tableId = Number(searchParams.tableId);
  if (!tableId) return null;

  const table = await fetchTableWithId(tableId);
  const isValid = table && !table.isArchived;
  if (!isValid) return null;

  const company = await fetchCompanyFromOrder(tableId);

  if (!company) {
    return (
      <div className="mt-4 px-4">
        <Card className="p-6">
          <p className="text-center text-gray-600 dark:text-gray-400">
            Company information not available.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-4 px-4 pb-5">
      <div className="max-w-2xl mx-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <UsersGroupTwoRounded className="text-primary size-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              About Us
            </h1>
          </div>

          <Divider className="mb-6" />

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {company.name}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Welcome to {company.name}! We are dedicated to providing you
                with exceptional dining experiences and delicious cuisine. Our
                restaurant combines traditional flavors with modern culinary
                techniques to bring you the best in food and service.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Our Location
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {company.street}
                <br />
                {company.township}
                <br />
                {company.city}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Our Mission
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                At {company.name}, we strive to create memorable dining
                experiences by serving high-quality food with excellent service.
                We are committed to using fresh ingredients and maintaining the
                highest standards in everything we do.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Why Choose Us
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Fresh, high-quality ingredients</li>
                <li>Friendly and attentive service</li>
                <li>Comfortable and welcoming atmosphere</li>
                <li>Convenient QR code ordering system</li>
                <li>Quick and efficient service</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
