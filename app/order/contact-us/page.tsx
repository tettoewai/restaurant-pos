import { fetchTableWithId } from "@/app/lib/backoffice/data";
import { fetchCompanyFromOrder } from "@/app/lib/order/data";
import { Card, Divider } from "@heroui/react";
import { CallChatRounded, MapPointFavourite } from "@solar-icons/react/ssr";
import { Mail, Phone } from "lucide-react";

export default async function ContactUsPage({
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
              <CallChatRounded className="text-primary size-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Contact Us
            </h1>
          </div>

          <Divider className="mb-6" />

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Get in Touch
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                We&rsquo;d love to hear from you! Whether you have a question,
                feedback, or just want to say hello, feel free to reach out to
                us.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <MapPointFavourite className="text-primary size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Visit Us
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {company.street}
                    <br />
                    {company.township}
                    <br />
                    {company.city}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="text-primary size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Call Us
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Please contact our staff at the restaurant for phone
                    inquiries.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="text-primary size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Email Us
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    For inquiries, please speak with our staff or visit us in
                    person.
                  </p>
                </div>
              </div>
            </div>

            <Divider className="my-6" />

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Restaurant Hours
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Please contact the restaurant directly for operating hours and
                reservations.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Need Help?
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                If you need assistance with your order or have any questions,
                please don&rsquo;t hesitate to ask our friendly staff.
                We&rsquo;re here to help make your dining experience enjoyable!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
