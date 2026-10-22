import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { adminTexts } from "@/shared/locales/admin";

import { ServiceUrlForm } from "../components";
import { useServiceSettings } from "../hooks";

/** Адрес сервиса отдельной страницей — с телефона; шире та же форма стоит в разделе. */
export function AdminServiceUrlPage() {
  const { data: settings } = useServiceSettings();

  return (
    <PagesMobileTemplate topBarBackTitle={adminTexts.serviceUrl.title}>
      {settings ? <ServiceUrlForm layout="page" /> : null}
    </PagesMobileTemplate>
  );
}
