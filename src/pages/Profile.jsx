import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Camera, Trophy, Star, CheckCircle2, Edit2, Check, X, Trash2, AlertTriangle, MapPin, Telescope } from 'lucide-react';
import LocationPicker from '../components/onboarding/LocationPicker';

import AuroraAlertManager from '../components/aurora/AuroraAlertManager';
import AuroraAlertSettings from '../components/profile/AuroraAlertSettings';
import OfflineCacheSettings from '../components/profile/OfflineCacheSettings';
import TierComparisonCard from '../components/profile/TierComparisonCard';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [sub, setSub] = useState(null);
  const [progress, setProgress] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [locationLat, setLocationLat] = useState(null);
  const [locationLon, setLocationLon] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);


  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      setName(me.full_name || '');
      const [subs, prog, myPhotos, profiles] = await Promise.all([
        base44.entities.Subscription.filter({ user_email: me.email }, '-created_date', 1),
        base44.entities.LessonProgress.filter({ user_email: me.email, completed: true }, '-created_date', 200),
        base44.entities.GalleryPost.filter({ user_email: me.email }, '-created_date', 12),
        base44.entities.UserProfile.filter({ user_email: me.email }, '-created_date', 1),
      ]);
      const hasSub = subs.length > 0 || me.role === 'admin';
      setSub(subs[0] || null);
      setIsSubscribed(hasSub);
      setProgress(prog);
      setPhotos(myPhotos);
      const profile = profiles[0] || null;
      setUserProfile(profile);
      setLocationName(profile?.home_location || '');
      setLocationLat(profile?.home_lat ?? null);
      setLocationLon(profile?.home_lon ?? null);
      setLoading(false);
    };
    load();
  }, []);

  const saveProfile = async () => {
    await base44.auth.updateMe({ full_name: name });
    setUser({ ...user, full_name: name });
    setEditing(false);
  };

  const saveLocation = async () => {
    const data = { user_email: user.email, home_location: locationName, home_lat: locationLat, home_lon: locationLon };
    if (userProfile) {
      await base44.entities.UserProfile.update(userProfile.id, data);
      setUserProfile({ ...userProfile, ...data });
    } else {
      const created = await base44.entities.UserProfile.create({ ...data, onboarding_complete: true });
      setUserProfile(created);
    }
    setEditingLocation(false);
  };

  const handleAuroraAlertUpdate = async (updates) => {
    const newAlerts = updates.locations !== undefined ? updates.locations : (userProfile?.alert_locations || []);
    const newEnabled = updates.alertsEnabled !== undefined ? updates.alertsEnabled : userProfile?.alert_prefs?.aurora_alerts_enabled;
    const data = {
      user_email: user.email,
      alert_locations: newAlerts,
      alert_prefs: { ...userProfile?.alert_prefs, aurora_alerts_enabled: newEnabled },
    };
    if (userProfile) {
      await base44.entities.UserProfile.update(userProfile.id, data);
      setUserProfile({ ...userProfile, ...data });
    } else {
      const created = await base44.entities.UserProfile.create({ ...data, onboarding_complete: true });
      setUserProfile(created);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    // Delete all user data
    await Promise.all([
      base44.entities.LessonProgress.filter({ user_email: user.email }, '-created_date', 500)
        .then(records => Promise.all(records.map(r => base44.entities.LessonProgress.delete(r.id)))),
      base44.entities.GalleryPost.filter({ user_email: user.email }, '-created_date', 100)
        .then(records => Promise.all(records.map(r => base44.entities.GalleryPost.delete(r.id)))),
      base44.entities.UserProfile.filter({ user_email: user.email }, '-created_date', 5)
        .then(records => Promise.all(records.map(r => base44.entities.UserProfile.delete(r.id)))),
    ]);
    base44.auth.logout();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Camera className="w-10 h-10 text-red-400 star-pulse" />
    </div>
  );

  const completedModules = Math.floor(progress.length / 8); // rough estimate
  const badges = [
    { label: 'Night Photographer', unlocked: progress.length >= 1, icon: '🌙' },
    { label: 'Gear Master', unlocked: progress.length >= 8, icon: '📷' },
    { label: 'Settings Pro', unlocked: progress.length >= 16, icon: '⚙️' },
    { label: 'Composer', unlocked: progress.length >= 24, icon: '🎨' },
    { label: 'Dark Sky Hunter', unlocked: progress.length >= 32, icon: '🗺️' },
    { label: 'Post-Processing Wizard', unlocked: progress.length >= 40, icon: '✨' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white mb-2">My Profile</h1>
        <p className="text-slate-400 text-sm">Manage your account, progress, and preferences</p>
      </div>

      {/* Hero Section: Identity + Subscription */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {/* Avatar & Name */}
        <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border-white/8 p-8 text-center md:col-span-1">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-700 to-red-500 flex items-center justify-center text-4xl font-bold text-white mx-auto mb-5 shadow-lg">
            {user?.full_name?.[0] || user?.email?.[0] || 'U'}
          </div>

          {editing ? (
            <div className="space-y-3">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white text-center"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold" onClick={saveProfile}>
                  <Check className="w-3 h-3 mr-1" /> Save
                </Button>
                <Button size="sm" variant="outline" className="flex-1 border-slate-700 text-slate-400" onClick={() => setEditing(false)}>
                  <X className="w-3 h-3 mr-1" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-black text-white mb-1">{user?.full_name || 'Anonymous'}</h2>
              <p className="text-slate-500 text-xs mb-5 break-all">{user?.email}</p>
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 w-full" onClick={() => setEditing(true)}>
                <Edit2 className="w-3 h-3 mr-1" /> Edit Name
              </Button>
            </>
          )}
        </Card>

        {/* Plan & Stats Summary */}
        <div className="md:col-span-2 space-y-5">
          {/* Subscription Plan */}
          {sub && (
            <Card className={`p-6 border ${sub.tier === 'lifetime' ? 'bg-gradient-to-br from-red-900/30 to-red-800/10 border-red-600/30' : 'bg-[#1a1a1a] border-white/8'}`}>
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Current Plan</p>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white capitalize">{sub.tier}</h3>
                  {sub.tier !== 'lifetime' && sub.end_date && (
                    <p className="text-slate-500 text-xs mt-1">Auto-renews {format(new Date(sub.end_date), 'MMM d, yyyy')}</p>
                  )}
                </div>
                <div className="text-3xl">{sub.tier === 'lifetime' ? '♾️' : '⭐'}</div>
              </div>
            </Card>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Lessons', value: progress.length, icon: '📚' },
              { label: 'Modules', value: completedModules, icon: '🎓' },
              { label: 'Shared', value: photos.length, icon: '📸' },
            ].map(s => (
              <Card key={s.label} className="bg-[#1a1a1a] border-white/8 p-4 text-center">
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className="text-white font-black text-xl">{s.value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <Card className="bg-[#1a1a1a] border-white/8 p-8 mb-10">
        <h3 className="text-white font-black text-lg mb-6 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-red-400" /> Achievements
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {badges.map(badge => (
            <div key={badge.label} className={`text-center p-4 rounded-xl border transition-all ${badge.unlocked ? 'bg-red-900/20 border-red-600/30 hover:border-red-500/50 cursor-pointer' : 'bg-white/5 border-white/8 opacity-30'}`}>
              <p className="text-3xl mb-2">{badge.icon}</p>
              <p className="text-xs font-semibold text-white leading-tight">{badge.label}</p>
              {badge.unlocked && <CheckCircle2 className="w-3 h-3 text-red-400 mx-auto mt-2" />}
            </div>
          ))}
        </div>
      </Card>

      {/* Settings Section */}
      <div className="space-y-6 mb-10">
        {/* Location */}
        <Card className="bg-[#1a1a1a] border-white/8 p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-black flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-red-400" /> Home Base
            </h3>
            {!editingLocation && (
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:border-slate-600" onClick={() => setEditingLocation(true)}>
                <Edit2 className="w-3 h-3 mr-1" /> Edit
              </Button>
            )}
          </div>
          {editingLocation ? (
            <div className="space-y-3">
              <LocationPicker
                value={locationName}
                lat={locationLat}
                lon={locationLon}
                onChange={({ name, lat, lon }) => { setLocationName(name); setLocationLat(lat ?? null); setLocationLon(lon ?? null); }}
              />
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-semibold" onClick={saveLocation}>
                  <Check className="w-3 h-3 mr-1" /> Save
                </Button>
                <Button size="sm" variant="outline" className="border-slate-700 text-slate-400" onClick={() => setEditingLocation(false)}>
                  <X className="w-3 h-3 mr-1" />
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {locationName ? (
                <div>
                  <p className="text-white font-semibold text-lg">{locationName}</p>
                  {locationLat && locationLon && (
                    <p className="text-slate-500 text-xs font-mono mt-1">{locationLat.toFixed(5)}, {locationLon.toFixed(5)}</p>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No home base set yet</p>
              )}
            </div>
          )}
        </Card>

        {/* Aurora Alerts */}
        {isSubscribed && (
          <AuroraAlertSettings
            profile={userProfile}
            onSave={handleAuroraAlertUpdate}
          />
        )}

        {/* Cache Settings */}
        <OfflineCacheSettings />
      </div>

      {/* Plans & Subscription Info */}
      <div className="mb-10">
        <TierComparisonCard currentTier={sub?.tier || (isSubscribed ? 'monthly' : 'free')} />
      </div>

      {/* Danger Zone */}
      <Card className="bg-red-950/20 border border-red-900/40 p-8 mb-10">
        <h3 className="text-red-400 font-black text-lg mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Danger Zone
        </h3>
        <p className="text-slate-500 text-sm mb-4">Permanently delete your account and all data. This action cannot be undone.</p>
        <Button variant="outline" size="sm" className="border-red-700 text-red-400 hover:bg-red-900/30 font-semibold" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="w-3 h-3 mr-1.5" /> Delete Account
        </Button>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#1a1a1a] border-white/8 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" /> Delete Account
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-slate-400 text-sm mb-4">This will permanently delete all your progress, photos, and profile data. Type <span className="text-white font-mono">DELETE</span> to confirm.</p>
            <Input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-slate-700 text-slate-400" onClick={() => { setShowDeleteDialog(false); setDeleteConfirm(''); }}>
              Cancel
            </Button>
            <Button
              disabled={deleteConfirm !== 'DELETE' || deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteAccount}
            >
              {deleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* My Photos */}
      {photos.length > 0 && (
        <Card className="bg-[#1a1a1a] border-white/8 p-6">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" /> My Gallery Photos
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map(p => (
              <div key={p.id} className="aspect-square rounded-lg overflow-hidden">
                <img src={p.photo_url} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-200" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}