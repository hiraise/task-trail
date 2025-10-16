import { useParams } from "next/navigation";
import styled from "styled-components";

import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { useProjectMenuItems } from "@/application/projects/hooks/useProjectMenuItems";
import { Icon } from "@/presentation/ui/Icon";

const MenuWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MenuButton = styled.button`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 8px 8px 8px 0px;
  border: none;
  border-radius: 12px;
  background-color: transparent;
  transition: background-color 0.2s;
  height: 40px;

  svg {
    margin: -4px;
  }

  &:hover {
    cursor: pointer;
    background-color: var(--bg-secondary-2);
  }
`;

export default function ProjectSettingsModal(props: BaseModalProps<void>) {
  const params = useParams();
  const projectId = Number(params.id);
  const { menuItems } = useProjectMenuItems(projectId);

  return (
    <BaseModal {...props} title="">
      <MenuWrapper>
        {menuItems.map((item, index) => (
          <MenuButton
            key={index}
            style={{ color: item.color ? item.color : undefined }}
            onClick={item.onClick}
          >
            {item.icon && <Icon as={item.icon} size="24px" inheritColor />}
            <span className="btn-font-s" style={{ color: "inherit" }}>
              {item.label}
            </span>
          </MenuButton>
        ))}
      </MenuWrapper>
    </BaseModal>
  );
}
