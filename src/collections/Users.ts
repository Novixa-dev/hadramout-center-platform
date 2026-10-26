import type { CollectionConfig } from 'payload';
import { isAdmin, L } from './shared.ts';

type StaffUser = { id?: number | string; role?: string } | null | undefined;

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: L('مستخدم', 'User'), plural: L('المستخدمون', 'Users') },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'email', 'role'], group: L('الإدارة', 'Administration') },
  auth: {
    tokenExpiration: 60 * 60 * 12,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  access: {
    // The very first user can be created without being logged in (initial setup); afterwards only admins can.
    create: async ({ req }) => {
      if (req.user) return (req.user as StaffUser)?.role === 'admin';
      const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true });
      return totalDocs === 0;
    },
    // admins see every account; editors and reviewers only their own (SEC-003: staff emails are not shared across roles)
    read: ({ req }) => {
      const user = req.user as StaffUser;
      if (!user) return false;
      return user.role === 'admin' ? true : { id: { equals: user.id } };
    },
    update: ({ req, id }) => {
      const user = req.user as StaffUser;
      return user?.role === 'admin' || String(user?.id) === String(id);
    },
    delete: isAdmin,
    admin: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: L('الاسم', 'Name') },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: L('مدير', 'Admin'), value: 'admin' },
        { label: L('محرر', 'Editor'), value: 'editor' },
        { label: L('مراجع ترجمة', 'Translation reviewer'), value: 'reviewer' },
      ],
      label: L('الدور', 'Role'),
      access: { update: ({ req }) => (req.user as StaffUser)?.role === 'admin' },
      admin: { description: L('المدير: كل شيء · المحرر: المحتوى · المراجع: تصحيح الترجمات فقط', 'Admin: everything · Editor: content · Reviewer: translation fixes only') },
    },
  ],
};
