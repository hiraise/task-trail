"use client";

import { SectionTitle } from "@/presentation/widgets/common/SectionTitle";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { MobileLogo } from "@/presentation/ui/MobileLogo";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import PasswordRecoveryForm from "@/presentation/widgets/auth/PasswordRecoveryForm/PasswordRecoveryForm";

const passwordRecoveryTexts = {
  title: "Восстановление пароля",
  subtitle:
    "Введите e-mail, указанный при регистрации — мы отправим вам письмо для восстановления пароля",
};

export default function PasswordRecoveryPage() {
  return (
    <MainContainer>
      <MobileLogo />
      <Spacer size="56px" />
      <SectionTitle
        title={passwordRecoveryTexts.title}
        subtitle={passwordRecoveryTexts.subtitle}
      />
      <Spacer size="56px" />
      <PasswordRecoveryForm />
    </MainContainer>
  );
}
