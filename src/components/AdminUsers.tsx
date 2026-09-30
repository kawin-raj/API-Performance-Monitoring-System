import React from 'react';
import { Users, ShieldCheck, Lock, Activity } from 'lucide-react';
import { User } from '../types.js';

interface AdminUsersProps {
  users: User[];
  currentUser: User;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ users, currentUser }) => {
  return (
    <div className="space-y-6">
      <div className="p-3.5 rounded bg-[#111218] border border-[#24262F] flex items-center justify-between">
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            User Management & Role Access Control
          </h3>
          <p className="text-[10px] text-gray-500 font-mono">
            Authorized personnel, role privileges, and authentication audit logs.
          </p>
        </div>
      </div>

      <div className="bg-[#111218] border border-[#24262F] rounded p-4 shadow-sm">
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-200 mb-3">System Accounts & Roles</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#1A1C24] text-gray-400 font-semibold border-b border-[#24262F]">
              <tr>
                <th className="p-2 text-[10px] uppercase">User Name</th>
                <th className="p-2 text-[10px] uppercase">Email Address</th>
                <th className="p-2 text-[10px] uppercase">Role</th>
                <th className="p-2 text-[10px] uppercase">Created Date</th>
                <th className="p-2 text-[10px] uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24262F]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#1A1C24]/50 transition-colors">
                  <td className="p-2 font-bold text-white flex items-center space-x-2">
                    <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover border border-[#24262F]" />
                    <span>{u.name}</span>
                  </td>
                  <td className="p-2 font-mono text-gray-300">{u.email}</td>
                  <td className="p-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-2 font-mono text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-2 text-green-400 font-bold font-mono text-[10px]">ACTIVE</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
