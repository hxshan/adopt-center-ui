import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Key, Mail, Smartphone, Globe, Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { toast } from 'sonner';
import { profileAPI } from '../services/api';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [orgLoading, setOrgLoading] = useState(true);

  // User State
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Organization State
  const [orgData, setOrgData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    licenseNumber: '',
  });

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notifications State
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    browser: true
  });

  // Fetch user profile on mount
  useEffect(() => {
    fetchUserProfile();
    fetchOrganizationProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setUserLoading(true);
      const response = await profileAPI.getCurrentUser();
      if (response.success) {
        const user = response.data;
        setUserData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error(error.message || 'Failed to load user profile');
    } finally {
      setUserLoading(false);
    }
  };

  const fetchOrganizationProfile = async () => {
    try {
      setOrgLoading(true);
      const response = await profileAPI.getOrganization();
      if (response.success) {
        const org = response.data;
        setOrgData({
          name: org.name || '',
          email: org.email || '',
          phone: org.phone || '',
          address: org.address || '',
          description: org.description || '',
          licenseNumber: org.licenseNumber || '',
        });
      }
    } catch (error) {
      console.error('Error fetching organization profile:', error);
      toast.error(error.message || 'Failed to load organization profile');
    } finally {
      setOrgLoading(false);
    }
  };

  const handleUserUpdate = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.updateCurrentUser(userData);
      if (response.success) {
        toast.success('Personal information updated successfully!');
        // Update localStorage user data
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...storedUser,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
        }));
        // Refresh to update header
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast.error(error.message || 'Failed to update personal information');
    } finally {
      setLoading(false);
    }
  };

  const handleOrgUpdate = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.updateOrganization(orgData);
      if (response.success) {
        toast.success('Organization information updated successfully!');
      }
    } catch (error) {
      console.error('Error updating organization profile:', error);
      toast.error(error.message || 'Failed to update organization information');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const response = await profileAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        toast.success('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    return `${userData.firstName?.charAt(0) || ''}${userData.lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account preferences and system configurations.</p>
      </div>

      <div className="grid gap-8">
        {/* Personal Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Update your personal details and contact information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20 border-2 border-slate-100">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`} />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {userData.firstName} {userData.lastName}
                </p>
                <p className="text-sm text-slate-500">{userData.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={userData.firstName}
                  onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={userData.lastName}
                  onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userPhone">Phone</Label>
                <Input
                  id="userPhone"
                  value={userData.phone}
                  onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleUserUpdate}
                disabled={loading}
                className="bg-pink-600 hover:bg-pink-700 w-40"
              >
                {loading ? 'Saving...' : 'Save Personal Info'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Organization Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Organization Information
            </CardTitle>
            <CardDescription>Manage your PetConnect details and public profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {orgLoading ? (
              <div className="text-slate-500 text-sm">Loading organization details...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={orgData.name}
                      onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgEmail">Organization Email</Label>
                    <Input
                      id="orgEmail"
                      type="email"
                      value={orgData.email}
                      onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgPhone">Organization Phone</Label>
                    <Input
                      id="orgPhone"
                      value={orgData.phone}
                      onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      value={orgData.licenseNumber}
                      onChange={(e) => setOrgData({ ...orgData, licenseNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={orgData.address}
                    onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="w-full min-h-24 px-3 py-2 text-sm rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                    value={orgData.description}
                    onChange={(e) => setOrgData({ ...orgData, description: e.target.value })}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleOrgUpdate}
                    disabled={loading}
                    className="bg-pink-600 hover:bg-pink-700 w-40"
                  >
                    {loading ? 'Saving...' : 'Save Organization'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure how you receive alerts and updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <div>
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-slate-500">Receive daily summaries and critical alerts.</p>
                </div>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(c) => setNotifications(prev => ({ ...prev, email: c }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-slate-500" />
                <div>
                  <Label className="text-base">SMS Notifications</Label>
                  <p className="text-sm text-slate-500">Get text messages for urgent adoption requests.</p>
                </div>
              </div>
              <Switch
                checked={notifications.sms}
                onCheckedChange={(c) => setNotifications(prev => ({ ...prev, sms: c }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-slate-500" />
                <div>
                  <Label className="text-base">Browser Push</Label>
                  <p className="text-sm text-slate-500">Show desktop notifications when active.</p>
                </div>
              </div>
              <Switch
                checked={notifications.browser}
                onCheckedChange={(c) => setNotifications(prev => ({ ...prev, browser: c }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security / Change Password Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your password and account security.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handlePasswordChange}
                disabled={loading}
                variant="outline"
                className="w-40"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;