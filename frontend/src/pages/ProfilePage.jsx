import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Avatar from '../components/common/Avatar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [name,      setName]      = useState(user?.name||'');
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pwForm,    setPwForm]    = useState({ currentPassword:'', newPassword:'' });
  const [pwLoading, setPwLoading] = useState(false);
  const [confirm,   setConfirm]   = useState(null);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2*1024*1024) return toast.error('Image must be under 2MB.');
    if (!file.type.startsWith('image/')) return toast.error('Please select an image.');
    setUploading(true);
    try {
      const base64 = await new Promise((res,rej) => {
        const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file);
      });
      await api.put('/users/profile', { avatar: base64 });
      updateUser({ avatar: base64 });
      toast.success('Profile photo updated! 📸');
    } catch { toast.error('Failed to update photo.'); }
    finally { setUploading(false); }
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    try { await api.put('/users/profile', { avatar:'' }); updateUser({ avatar:'' }); toast.success('Photo removed.'); }
    catch { toast.error('Failed.'); }
    finally { setUploading(false); setConfirm(null); }
  };

  const handleSaveName = async () => {
    if (!name.trim()) return toast.error('Name cannot be empty.');
    setSaving(true);
    try { await api.put('/users/profile',{name}); updateUser({name}); toast.success('Name updated!'); }
    catch (err) { toast.error(err.response?.data?.message||'Failed.'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async e => {
    e.preventDefault();
    if (!pwForm.currentPassword||!pwForm.newPassword) return toast.error('Both fields required.');
    if (pwForm.newPassword.length<6) return toast.error('New password must be at least 6 characters.');
    setPwLoading(true);
    try { await api.put('/users/change-password',pwForm); toast.success('Password changed!'); setPwForm({currentPassword:'',newPassword:''}); }
    catch (err) { toast.error(err.response?.data?.message||'Failed.'); }
    finally { setPwLoading(false); }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6 anim-slide-up">
          <button onClick={()=>navigate('/dashboard')} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
            style={{ border:'1px solid rgba(25,30,15,0.1)' }}>
            <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily:'DM Sans,sans-serif' }}>Profile Settings</h1>
        </div>

        {/* Avatar */}
        <div className="card mb-4 anim-slide-up d100">
          <h2 className="label mb-4">Profile Photo</h2>
          <div className="flex items-center gap-5 flex-wrap">
            <div className="relative">
              <Avatar user={user} size="2xl" />
              {uploading && (
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
                  style={{ background:'rgba(0,0,0,0.55)' }}>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={()=>fileRef.current?.click()} disabled={uploading} className="btn-primary text-sm py-2">
                📸 Upload Photo
              </button>
              {user?.avatar && (
                <button
                  onClick={()=>setConfirm({action:handleRemoveAvatar, title:'Remove Photo', message:'Remove your profile photo?', variant:'warning', confirmText:'Remove'})}
                  disabled={uploading} className="btn-secondary text-sm py-2">
                  Remove Photo
                </button>
              )}
              <p className="text-xs text-white/25">JPG, PNG or GIF · Max 2MB</p>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>

        {/* Name + email */}
        <div className="card mb-4 anim-slide-up d200">
          <h2 className="label mb-4">Account Info</h2>
          <div className="mb-4">
            <label className="label">Display Name</label>
            <div className="flex gap-2">
              <input value={name} onChange={e=>setName(e.target.value)} className="input flex-1" />
              <button onClick={handleSaveName} disabled={saving} className="btn-primary whitespace-nowrap">
                {saving?'...':'Save'}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input value={user?.email||''} disabled className="input opacity-40 cursor-not-allowed" />
          </div>
          <div className="mt-3">
            <span className={`badge text-xs ${user?.authProvider==='google'?'badge-active':'badge-locked'}`}>
              {user?.authProvider==='google'?'🔵 Google Account':'📧 Email Account'}
            </span>
          </div>
        </div>

        {/* Change password */}
        {user?.authProvider==='local' && (
          <div className="card mb-4 anim-slide-up d300">
            <h2 className="label mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div><label className="label">Current Password</label>
                <input type="password" value={pwForm.currentPassword} onChange={e=>setPwForm({...pwForm,currentPassword:e.target.value})} className="input" placeholder="••••••••" /></div>
              <div><label className="label">New Password</label>
                <input type="password" value={pwForm.newPassword} onChange={e=>setPwForm({...pwForm,newPassword:e.target.value})} className="input" placeholder="Min. 6 characters" /></div>
              <button type="submit" disabled={pwLoading} className="btn-primary">{pwLoading?'Updating...':'Update Password'}</button>
            </form>
          </div>
        )}

        {/* Sign out */}
        <div className="card anim-slide-up d400" style={{ borderColor:'rgba(214,63,63,0.15)' }}>
          <h2 className="label mb-1">Sign Out</h2>
          <p className="text-sm text-white/25 mb-4">You will be redirected to the home page.</p>
          <button
            onClick={()=>setConfirm({action:async()=>{await logout();navigate('/');}, title:'Sign Out', message:'Are you sure you want to sign out?', variant:'warning', confirmText:'Sign Out'})}
            className="btn-danger">
            Sign Out
          </button>
        </div>
      </div>

      {confirm && (
        <ConfirmDialog title={confirm.title} message={confirm.message}
          variant={confirm.variant} confirmText={confirm.confirmText}
          onConfirm={confirm.action} onCancel={()=>setConfirm(null)} />
      )}
    </div>
  );
}
