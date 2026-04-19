// shared/config/roles.ts
// Configuración global e inmutable de roles. Sin lógica de negocio.

export const ROLES = {
  ADMIN: "admin",
  DENTIST: "dentist",
  ASSISTANT: "assistant",
  PATIENT: "patient",
} as const;

export type RoleId = (typeof ROLES)[keyof typeof ROLES];

export interface RoleMeta {
  id: RoleId;
  label: string;
  icon: string;
  bgClass: string;
  textClass: string;
  barClass: string;
  badgeClass: string;
  avatarClass: string;
  description: string;
  permissions: string[];
}

export const ROLE_META: Record<RoleId, RoleMeta> = {
  admin: {
    id: "admin",
    label: "Administrador",
    icon: "Shield",
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-400",
    barClass: "bg-purple-500",
    badgeClass: "bg-purple-500/10 text-purple-400",
    avatarClass: "bg-purple-500/20 text-purple-300",
    description:
      "Acceso completo al sistema. Gestiona usuarios, configuración y reportes.",
    permissions: ["Gestionar usuarios"],
  },
  dentist: {
    id: "dentist",
    label: "Dentista",
    icon: "Stethoscope",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-400",
    barClass: "bg-blue-500",
    badgeClass: "bg-blue-500/10 text-blue-400",
    avatarClass: "bg-blue-500/20 text-blue-300",
    description:
      "Profesional médico con acceso a expedientes clínicos y agenda.",
    permissions: [
      "Ver expedientes clínicos",
      "Gestionar citas",
      "Generar Expedientes",
      "Ver calendario",
    ],
  },
  assistant: {
    id: "assistant",
    label: "Asistente",
    icon: "Headset",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-400",
    barClass: "bg-amber-500",
    badgeClass: "bg-amber-500/10 text-amber-400",
    avatarClass: "bg-amber-500/20 text-amber-300",
    description: "Apoyo administrativo para gestión de citas y recepción.",
    permissions: ["Agendar citas", "Ver calendario"],
  },
  patient: {
    id: "patient",
    label: "Paciente",
    icon: "User",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-400",
    barClass: "bg-emerald-500",
    badgeClass: "bg-emerald-500/10 text-emerald-400",
    avatarClass: "bg-emerald-500/20 text-emerald-300",
    description: "Acceso limitado al portal del paciente y citas personales.",
    permissions: ["Ver mis citas", "Ver mi expediente", "Solicitar cita"],
  },
};

export const ROLES_LIST: RoleMeta[] = Object.values(ROLE_META);
