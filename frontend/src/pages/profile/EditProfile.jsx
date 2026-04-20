/**
 * FarmConnect — Edit Profile Page
 * Works for both farmers and buyers.
 * Farmer sees farm name, location, phone, description.
 * Buyer sees delivery address and phone.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { updateProfile, changePassword } from '../../api/authApi'
import { Button, Input, Alert, Logo } from '../../components/ui'

export default function EditProfile() {
  const { user, logout, updateUser } = useAuth()
  const isFarmer = user?.role === 'farmer'

  // ── Profile form ────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    first_name:       user?.first_name       || '',
    last_name:        user?.last_name        || '',
    farm_name:        user?.farmerprofile?.farm_name        || '',
    location:         user?.farmerprofile?.location         || '',
    phone:            isFarmer
                        ? user?.farmerprofile?.phone        || ''
                        : user?.buyerprofile?.phone         || '',
    description:      user?.farmerprofile?.description      || '',
    delivery_address: user?.buyerprofile?.delivery_address  || '',
  })
  const [saving,        setSaving]        = useState(false)
  const [profileSuccess,setProfileSuccess]= useState('')
  const [profileError,  setProfileError]  = useState('')
  const [profileErrors, setProfileErrors] = useState({})

  // ── Password form ────────────────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({
    old_password: '', new_password: '', confirm_password: ''
  })
  const [savingPwd,    setSavingPwd]    = useState(false)
  const [pwdSuccess,   setPwdSuccess]   = useState('')
  const [pwdError,     setPwdError]     = useState('')
  const [pwdErrors,    setPwdErrors]    = useState({})

  const handleProfileChange = e => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
    if (profileErrors[name]) setProfileErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handlePasswordChange = e => {
    const { name, value } = e.target
    setPasswords(prev => ({ ...prev, [name]: value }))
    if (pwdErrors[name]) setPwdErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSaveProfile = async e => {
    e.preventDefault()
    setSaving(true)
    setProfileError('')
    setProfileSuccess('')

    try {
      const updated = await updateProfile(profile)
      updateUser(updated)
      setProfileSuccess('Profile updated successfully!')
      setTimeout(() => setProfileSuccess(''), 4000)
    } catch (err) {
      const errs = err.response?.data?.errors
      if (errs) setProfileErrors(
        Object.fromEntries(Object.entries(errs).map(([k,v]) => [k, Array.isArray(v) ? v[0] : v]))
      )
      else setProfileError(err.response?.data?.error || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async e => {
    e.preventDefault()

    // Client-side validation
    const errs = {}
    if (!passwords.old_password)     errs.old_password     = 'Current password is required.'
    if (!passwords.new_password)     errs.new_password     = 'New password is required.'
    if (passwords.new_password.length < 8) errs.new_password = 'Minimum 8 characters.'
    if (passwords.new_password !== passwords.confirm_password)
      errs.confirm_password = 'Passwords do not match.'
    if (Object.keys(errs).length) { setPwdErrors(errs); return }

    setSavingPwd(true)
    setPwdError('')
    setPwdSuccess('')

    try {
      await changePassword(passwords)
      setPwdSuccess('Password changed successfully!')
      setPasswords({ old_password: '', new_password: '', confirm_password: '' })
      setTimeout(() => setPwdSuccess(''), 4000)
    } catch (err) {
      const errs = err.response?.data?.errors
      if (errs) setPwdErrors(
        Object.fromEntries(Object.entries(errs).map(([k,v]) => [k, Array.isArray(v) ? v[0] : v]))
      )
      else setPwdError(err.response?.data?.error || 'Failed to change password.')
    } finally {
      setSavingPwd(false)
    }
  }

  const dashboardLink = user?.role === 'farmer'
    ? '/farmer/dashboard'
    : user?.role === 'admin'
    ? '/admin/dashboard'
    : '/buyer/dashboard'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4
                         flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <Link to={dashboardLink}
            className="text-sm text-gray-500 hover:text-primary-600">
            ← Dashboard
          </Link>
          <Button variant="secondary" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-farm-dark">Edit Profile</h1>
          <p className="text-gray-500 text-sm mt-1">
            Update your account information
          </p>
        </div>

        {/* ── Profile Picture placeholder ─────────────────────────────────── */}
        <div className="card p-6 mb-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center
                          justify-center text-primary-700 font-bold text-3xl shrink-0">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div>
            <p className="font-semibold text-farm-dark text-lg">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className={`badge mt-1 ${
              user?.role === 'farmer' ? 'badge-green'
              : user?.role === 'admin' ? 'bg-purple-100 text-purple-700'
              : 'badge-blue'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* ── Profile Details Form ─────────────────────────────────────────── */}
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-farm-dark mb-5">
            Personal Information
          </h2>

          {profileSuccess && <div className="mb-4"><Alert type="success" message={profileSuccess} /></div>}
          {profileError   && <div className="mb-4"><Alert type="error"   message={profileError}   /></div>}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name" name="first_name"
                value={profile.first_name} onChange={handleProfileChange}
                error={profileErrors.first_name} required
              />
              <Input
                label="Last Name" name="last_name"
                value={profile.last_name} onChange={handleProfileChange}
                error={profileErrors.last_name} required
              />
            </div>

            <Input
              label="Phone Number" name="phone" type="tel"
              value={profile.phone} onChange={handleProfileChange}
              error={profileErrors.phone}
              placeholder="+256 700 000 000"
            />

            {/* Farmer-specific fields */}
            {isFarmer && (
              <>
                <Input
                  label="Farm Name" name="farm_name"
                  value={profile.farm_name} onChange={handleProfileChange}
                  error={profileErrors.farm_name}
                  placeholder="e.g. Green Valley Farm"
                />
                <Input
                  label="Farm Location" name="location"
                  value={profile.location} onChange={handleProfileChange}
                  error={profileErrors.location}
                  placeholder="e.g. Wakiso, Uganda"
                />
                <div className="space-y-1">
                  <label className="label">Farm Description</label>
                  <textarea
                    name="description"
                    value={profile.description}
                    onChange={handleProfileChange}
                    className="input h-24 resize-none"
                    placeholder="Tell buyers about your farm — what you grow, your methods, your story..."
                  />
                </div>
              </>
            )}

            {/* Buyer-specific fields */}
            {!isFarmer && user?.role !== 'admin' && (
              <div className="space-y-1">
                <label className="label">Default Delivery Address</label>
                <textarea
                  name="delivery_address"
                  value={profile.delivery_address}
                  onChange={handleProfileChange}
                  className="input h-24 resize-none"
                  placeholder="Your default delivery address e.g. Plot 23, Kampala Road, Wakiso"
                />
                <p className="text-xs text-gray-400">
                  This will be pre-filled at checkout
                </p>
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" loading={saving} size="lg">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>

        {/* ── Change Password Form ─────────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="font-semibold text-farm-dark mb-5">Change Password</h2>

          {pwdSuccess && <div className="mb-4"><Alert type="success" message={pwdSuccess} /></div>}
          {pwdError   && <div className="mb-4"><Alert type="error"   message={pwdError}   /></div>}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password" name="old_password" type="password"
              value={passwords.old_password} onChange={handlePasswordChange}
              error={pwdErrors.old_password} required
              placeholder="Enter your current password"
            />
            <Input
              label="New Password" name="new_password" type="password"
              value={passwords.new_password} onChange={handlePasswordChange}
              error={pwdErrors.new_password} required
              placeholder="At least 8 characters"
            />
            <Input
              label="Confirm New Password" name="confirm_password" type="password"
              value={passwords.confirm_password} onChange={handlePasswordChange}
              error={pwdErrors.confirm_password} required
              placeholder="Repeat new password"
            />
            <div className="pt-2">
              <Button type="submit" loading={savingPwd} variant="secondary">
                {savingPwd ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
