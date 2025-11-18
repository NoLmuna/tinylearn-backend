import AdminEditModal from './admin/users/modals/AdminEditModal';
import TeacherEditModal from './admin/users/modals/TeacherEditModal';
import StudentEditModal from './admin/users/modals/StudentEditModal';
import ParentEditModal from './admin/users/modals/ParentEditModal';

const ROLE_MODAL_MAP = {
  admin: AdminEditModal,
  teacher: TeacherEditModal,
  student: StudentEditModal,
  parent: ParentEditModal
};

const EditUserModal = ({ selectedUser, role, ...rest }) => {
  console.log('[EditUserModal] mounted with role:', selectedUser?.role || role, 'isOpen:', rest.isOpen);

  if (!rest.isOpen) return null;

  const derivedRole = (selectedUser?.role || role || '').toLowerCase();
  const ModalComponent = ROLE_MODAL_MAP[derivedRole];

  if (!ModalComponent) {
    console.warn(`No edit modal configured for role: ${derivedRole}`);
    return null;
  }

  return <ModalComponent {...rest} selectedUser={selectedUser} role={derivedRole} />;
};

export default EditUserModal;
