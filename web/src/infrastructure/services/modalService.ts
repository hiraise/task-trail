import { store } from "@/infrastructure/redux/store";
import {
  openSheet,
  closeAllSheets,
  backSheet,
} from "@/application/modals/bottomSheetSlice";
import { CreateProject, InviteUser, ModalService } from "./modalService.types";
import { MODAL_TYPES } from "../config/modalTypes";

const showCreateProject: CreateProject = (props) => {
  store.dispatch(
    openSheet({
      type: MODAL_TYPES.CREATE_PROJECT,
      props: props || {},
    })
  );
};

const showInviteUser: InviteUser = (props) => {
  store.dispatch(
    openSheet({
      type: MODAL_TYPES.INVITE_USER,
      props: props || {},
    })
  );
};

const close = () => store.dispatch(backSheet());

const closeAll = () => store.dispatch(closeAllSheets());

export const modalService: ModalService = {
  showCreateProject,
  showInviteUser,
  close,
  closeAll,
};
