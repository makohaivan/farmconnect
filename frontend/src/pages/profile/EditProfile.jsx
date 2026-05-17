import { useState } from 'react'
import { User, Phone, MapPin, Lock, Wheat, Home } from 'lucide-react'
import AppLayout from '../../components/AppLayout'
import { Button, Input, Alert } from '../../components/ui'
import { updateProfile, changePassword } from '../../api/authApi'
import { useAuth } from '../../hooks/useAuth'

export default function EditProfile() {
  const { user, updateUser } = useAuth()
  const isFarmer = user?.role === 'farmer'

  const [profile, setProfile] = useState({
    first_name:       user?.first_name       || '',
    last_name:        user?.last_name        || '',
    farm_name:        user?.farmerprofile?.farm_name        || '',
    location:         user?.farmerprofile?.location         || '',
    phone:            isFarmer ? (user?.farmerprofile?.phone || '') : (user?.buyerprofile?.phone || ''),
    description:      user?.farmerprofile?.description      || '',
    delivery_address: user?.buyerprofile?.delivery_address  || '',
  })
  const [passwords, setPasswords] = useState({ old_password:'', new_password:'', confirm_password:'' })

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPwd,     setSavingPwd]     = useState(false)
  const [profileMsg,    setProfileMsg]    = useState({ type:'', text:'' })
  const [pwdMsg,        setPwdMsg]        = useState({ type:'', text:'' })
  const [profileErrors, setProfileErrors] = useState({})
  const [pwdErrors,     setPwdErrors]     = useState({})

  const handleProfileChange = e => {
    const { name, value } = e.target
    setProfile(p => ({ ...p, [name]: value }))
    if (profileErrors[name]) setProfileErrors(p => ({ ...p, [name]: '' }))
  }
  const handlePwdChange = e => {
    const { name, value } = e.target
    setPasswords(p => ({ ...p, [name]: value }))
    if (pwdErrors[name]) setPwdErrors(p => ({ ...p, [name]: '' }))
  }

  const handleSaveProfile = async e => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg({ type:'', text:'' })
    try {
      const updated = await updateProfile(profile)
      updateUser(updated)
      setProfileMsg({ type:'success', text:'Profile updated successfully!' })
    } catch (err) {
      const errs = err.response?.data?.errors
      if (errs) setProfileErrors(Object.fromEntries(Object.entries(errs).map(([k,v]) => [k, Array.isArray(v)?v[0]:v])))
      else setProfileMsg({ type:'error', text: err.response?.data?.error || 'Failed to update.' })
    } finally { setSavingProfile(false) }
  }

  const handleChangePwd = async e => {
    e.preventDefault()
    const e2 = {}
    if (!passwords.old_password)   e2.old_password = 'Required.'
    if (!passwords.new_password)   e2.new_password = 'Required.'
    if (passwords.new_password.length < 8) e2.new_password = 'Min 8 characters.'
    if (passwords.new_password !== passwords.confirm_password)
      e2.confirm_password = 'Passwords do not match.'
    if (Object.keys(e2).length) { setPwdErrors(e2); return }

    setSavingPwd(true)
    setPwdMsg({ type:'', text:'' })
    try {
      await changePassword(passwords)
      setPwdMsg({ type:'success', text:'Password changed successfully!' })
      setPasswords({ old_password:'', new_password:'', confirm_password:'' })
    } catch (err) {
      const errs = err.response?.data?.errors
      if (errs) setPwdErrors(Object.fromEntries(Object.entries(errs).map(([k,v]) => [k, Array.isArray(v)?v[0]:v])))
      else setPwdMsg({ type:'error', text: err.response?.data?.error || 'Failed to change password.' })
    } finally { setSavingPwd(false) }
  }

  return (
    <AppLayout title="Edit Profile" subtitle="Update your account information">
      <div className="max-w-2xl space-y-6">

        {/* Avatar card */}
        <div className="card p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500
                          to-primary-700 flex items-center justify-center
                          text-white font-bold text-3xl shrink-0">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-xl">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className={`badge mt-2 ${
              user?.role === 'farmer' ? 'badge-green'
              : user?.role === 'admin' ? 'badge-purple'
              : 'badge-blue'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Profile form */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Personal Information</h2>
          {profileMsg.text && <div className="mb-5"><Alert type={profileMsg.type} message={profileMsg.text} /></div>}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" name="first_name" icon={User}
                value={profile.first_name} onChange={handleProfileChange}
                error={profileErrors.first_name} required />
              <Input label="Last Name" name="last_name" icon={User}
                value={profile.last_name} onChange={handleProfileChange}
                error={profileErrors.last_name} required />
            </div>
            <Input label="Phone Number" name="phone" type="tel" icon={Phone}
              value={profile.phone} onChange={handleProfileChange}
              error={profileErrors.phone} placeholder="+256 700 000 000" />

            {isFarmer && (
              <>
                <Input label="Farm Name" name="farm_name" icon={Wheat}
                  value={profile.farm_name} onChange={handleProfileChange}
                  error={profileErrors.farm_name} placeholder="Green Valley Farm" />
                <Input label="Farm Location" name="location" icon={MapPin}
                  value={profile.location} onChange={handleProfileChange}
                  error={profileErrors.location} placeholder="Wakiso, Uganda" />
                <div className="space-y-1.5">
                  <label className="label">Farm Description</label>
                  <textarea name="description" value={profile.description}
                    onChange={handleProfileChange} className="input h-24 resize-none"
                    placeholder="Tell buyers about your farm…" />
                </div>
              </>
            )}

            {!isFarmer && user?.role !== 'admin' && (
              <div className="space-y-1.5">
                <label className="label">Default Delivery Address</label>
                <textarea name="delivery_address" value={profile.delivery_address}
                  onChange={handleProfileChange} className="input h-20 resize-none"
                  placeholder="Plot 23, Kampala Road, Wakiso" />
                <p className="hint-text">Pre-filled at checkout</p>
              </div>
            )}

            <Button type="submit" loading={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save Changes'}
            </Button>
          </form>
        </div>

        {/* Password form */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Change Password</h2>
          {pwdMsg.text && <div className="mb-5"><Alert type={pwdMsg.type} message={pwdMsg.text} /></div>}
          <form onSubmit={handleChangePwd} className="space-y-4">
            <Input label="Current Password" name="old_password" type="password"
              icon={Lock} value={passwords.old_password} onChange={handlePwdChange}
              error={pwdErrors.old_password} required />
            <Input label="New Password" name="new_password" type="password"
              icon={Lock} value={passwords.new_password} onChange={handlePwdChange}
              error={pwdErrors.new_password} required hint="Min 8 characters" />
            <Input label="Confirm New Password" name="confirm_password" type="password"
              icon={Lock} value={passwords.confirm_password} onChange={handlePwdChange}
              error={pwdErrors.confirm_password} required />
            <Button type="submit" variant="secondary" loading={savingPwd}>
              {savingPwd ? 'Changing…' : 'Change Password'}
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
