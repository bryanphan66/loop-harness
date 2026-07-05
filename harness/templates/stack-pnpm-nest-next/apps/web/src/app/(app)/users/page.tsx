import { UsersTable } from '@/components/users/users-table';

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Users</h1>
      <UsersTable />
    </div>
  );
}
