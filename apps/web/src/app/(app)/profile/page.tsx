'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/lib/firebase/client';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  middleInitial?: string;
  lastName?: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  userType: 'staff' | 'tenant';
  status: string;
  createdAt?: string;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '');
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return '??';
}

interface EditProfileModalProps {
  profile: UserProfile;
  onClose: () => void;
  onSave: (data: { firstName: string; middleInitial: string; lastName: string; phoneNumber: string }) => Promise<void>;
}

function EditProfileModal({ profile, onClose, onSave }: EditProfileModalProps) {
  const [firstName, setFirstName] = useState(profile.firstName || '');
  const [middleInitial, setMiddleInitial] = useState(profile.middleInitial || '');
  const [lastName, setLastName] = useState(profile.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSave({ firstName, middleInitial, lastName, phoneNumber });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border rounded-lg w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={saving}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {error && (
              <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-2">
                <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="First"
                  disabled={saving}
                />
              </div>
              <div className="col-span-1">
                <label htmlFor="middleInitial" className="block text-sm font-medium mb-1">
                  M.I.
                </label>
                <input
                  id="middleInitial"
                  type="text"
                  value={middleInitial}
                  onChange={(e) => setMiddleInitial(e.target.value.slice(0, 1).toUpperCase())}
                  maxLength={1}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                  disabled={saving}
                />
              </div>
              <div className="col-span-3">
                <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Last"
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="(555) 123-4567"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-3 py-2 border rounded-md bg-muted text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/portal/profile');
      const data = await res.json();
      if (data.ok) {
        setProfile(data.data);
      } else {
        setError(data.error || 'Failed to load profile');
      }
    } catch {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (data: { firstName: string; middleInitial: string; lastName: string; phoneNumber: string }) => {
    const res = await fetch('/api/portal/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.ok) {
      throw new Error(result.error || 'Failed to save changes');
    }
    setProfile(result.data);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setChangingPassword(true);

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('Not authenticated');
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string };
      if (firebaseErr.code === 'auth/wrong-password' || firebaseErr.code === 'auth/invalid-credential') {
        setPasswordError('Current password is incorrect');
      } else if (firebaseErr.code === 'auth/weak-password') {
        setPasswordError('New password is too weak. Use at least 6 characters.');
      } else {
        setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Link
          href="/llcs"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          &larr; Back to Dashboard
        </Link>
        <div className="space-y-4">
          <div className="h-8 bg-muted/30 rounded w-1/3 animate-pulse" />
          <div className="h-64 bg-muted/30 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div>
        <Link
          href="/llcs"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          &larr; Back to Dashboard
        </Link>
        <div className="p-6 border rounded-lg border-destructive/50 bg-destructive/10">
          <p className="text-destructive">{error || 'Profile not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
    <div className="mb-6">
      <Link
        href="/llcs"
        className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
      >
        &larr; Back to Dashboard
      </Link>

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <button
          onClick={() => setShowEditModal(true)}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Edit Profile
        </button>
      </div>

      {/* Profile Card */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header with avatar */}
        <div className="bg-muted/30 p-6 flex items-center gap-4">
          {profile.photoURL ? (
            <Image
              src={profile.photoURL}
              alt={profile.displayName || 'Profile'}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-semibold text-primary">
              {getInitials(profile.displayName, profile.email)}
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">
              {profile.displayName || 'No name set'}
            </h2>
            <p className="text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">First Name</p>
              <p className="font-medium">
                {profile.firstName || <span className="text-muted-foreground italic">Not set</span>}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Last Name</p>
              <p className="font-medium">
                {profile.lastName || <span className="text-muted-foreground italic">Not set</span>}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Email Address</p>
              <p className="font-medium">{profile.email}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Phone Number</p>
              <p className="font-medium">
                {profile.phoneNumber || <span className="text-muted-foreground italic">Not set</span>}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Account Status</p>
              <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                profile.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-400 dark:text-green-800'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
              </span>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Account Type</p>
              <p className="font-medium capitalize">{profile.userType}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Member Since</p>
              <p className="font-medium">{formatDate(profile.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="border rounded-lg mt-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Change Password</h2>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            {passwordError && (
              <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 text-sm">
                {passwordSuccess}
              </div>
            )}

            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
                disabled={changingPassword}
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
                minLength={6}
                disabled={changingPassword}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
                minLength={6}
                disabled={changingPassword}
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={changingPassword}
            >
              {changingPassword ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
    </div>
  );
}
