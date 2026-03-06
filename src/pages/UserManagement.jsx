import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Edit,
  Trash2,
  RotateCcw,
  MoreHorizontal,
  UserCheck,
  UserX,
  Download
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import PageActions from '../components/common/PageActions';
import { PageSpinner } from '../components/ui/Spinner';
import { toast } from 'sonner';

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = () => {
    // Get current user from localStorage
    const userJson = localStorage.getItem('user');
    if (userJson) {
      setCurrentUser(JSON.parse(userJson));
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await api.userManagement.getUsers();
      if (result.success) {
        setUsers(result.data);
      } else {
        setError(result.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to remove ${userName}? This action cannot be undone.`)) return;

    try {
      const result = await api.userManagement.removeUser(userId);
      if (result.success) {
        toast.success('User removed successfully');
        fetchUsers();
      } else {
        toast.error(result.message || 'Failed to remove user');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to remove user');
    }
  };

  const handleResendInvite = async (userId) => {
    try {
      const result = await api.userManagement.resendInvite(userId);
      if (result.success) {
        toast.success(`Invite resent! New temporary password: ${result.data.tempPassword}`);
      } else {
        toast.error(result.message || 'Failed to resend invite');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to resend invite');
    }
  };

  const handleActivateUser = async (userId, userName) => {
    try {
      const result = await api.userManagement.updateUser(userId, { isActive: true });
      if (result.success) {
        toast.success(`${userName} activated successfully`);
        fetchUsers();
      } else {
        toast.error(result.message || 'Failed to activate user');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to activate user');
    }
  };

  const handleDeactivateUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to deactivate ${userName}? They will not be able to log in.`)) return;

    try {
      const result = await api.userManagement.updateUser(userId, { isActive: false });
      if (result.success) {
        toast.success(`${userName} deactivated successfully`);
        fetchUsers();
      } else {
        toast.error(result.message || 'Failed to deactivate user');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to deactivate user');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'NIC'];
    const rows = users.map((u) => [
      `${u.firstName} ${u.lastName}`,
      u.email,
      u.phone || '',
      u.role,
      u.isActive ? 'Active' : 'Inactive',
      u.nic?.number || ''
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', 'users_list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRoleIcon = (role) => {
    return role === 'owner' ? ShieldCheck : Shield;
  };

  const getRoleColor = (role) => {
    return role === 'owner'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-blue-100 text-blue-700';
  };

  const canManageUser = (user) => {
    if (!currentUser) return false;
    // Owner can manage everyone except themselves
    if (currentUser.role === 'owner') {
      return user._id !== currentUser._id;
    }
    // Admin can only manage other admins (not owners or themselves)
    return user.role !== 'owner' && user._id !== currentUser._id;
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const actionItems = [
    { label: 'Invite User', icon: UserPlus, onClick: () => navigate('/invite-user') },
    { separator: true },
    { label: 'Export CSV', icon: Download, onClick: handleExportCSV },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 mt-1">
            Manage staff members of your PetConnect center
          </p>
        </div>
        <PageActions items={actionItems} />
      </div>

      {/* FilterBar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm bg-white"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setStatusFilter('all');
              }}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <PageSpinner label="Loading users..." />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
          {error}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {users.length === 0 ? 'No users yet' : 'No users found'}
          </h3>
          <p className="text-slate-600 mb-4">
            {users.length === 0
              ? 'Start by inviting staff members to your center'
              : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>NIC</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                const isCurrentUser = user._id === currentUser?._id;
                const canManage = canManageUser(user);
                const isInactive = !user.isActive;

                return (
                  <TableRow
                    key={user._id}
                    className={isInactive ? 'hover:bg-slate-50 opacity-60' : 'hover:bg-slate-50'}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className={isInactive ? 'text-slate-500' : 'text-slate-900'}>
                          {user.firstName} {user.lastName}
                        </span>
                        {isCurrentUser && (
                          <Badge variant="outline" className="w-fit mt-1 text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="w-4 h-4 text-slate-400" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="w-4 h-4 text-slate-400" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-900">
                        {user.nic?.number || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`inline-flex items-center gap-1 ${
                          user.role === 'owner'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        <RoleIcon className="w-3 h-3" />
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isInactive ? (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                          Inactive
                        </Badge>
                      ) : (
                        <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigate(`/edit-user/${user._id}`)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {isInactive ? (
                              <DropdownMenuItem
                                onClick={() => handleActivateUser(user._id, `${user.firstName} ${user.lastName}`)}
                              >
                                <UserCheck className="mr-2 h-4 w-4 text-emerald-600" /> Activate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleDeactivateUser(user._id, `${user.firstName} ${user.lastName}`)}
                              >
                                <UserX className="mr-2 h-4 w-4 text-amber-600" /> Deactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleResendInvite(user._id)}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" /> Resend Invite
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => handleRemoveUser(user._id, `${user.firstName} ${user.lastName}`)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Remove User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="text-sm text-slate-500">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  );
}
