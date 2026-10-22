import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { adminTexts } from "@/shared/locales/admin";

import { ServiceUrlForm } from "../components";
import { useServiceSettings } from "../hooks";

/** Service URL as a separate page, from a phone; wider, the same form is in the section. */
export function AdminServiceUrlPage() {
  const { data: settings } = useServiceSettings();

  return (
    <PagesMobileTemplate topBarBackTitle={adminTexts.serviceUrl.title}>
      {settings ? <ServiceUrlForm layout="page" /> : null}
    </PagesMobileTemplate>
  );
}
