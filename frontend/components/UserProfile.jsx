'use client'
import { useAuth } from '../app/contexts/AuthContext'

export default function UserProfile() {
    const { user, logout } = useAuth()

    if (!user) return null

    const initials = user.full_name
        ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : user.email.charAt(0).toUpperCase()

    return (
        <div className="glass-panel p-5">
            {/* User header */}
            <div className="flex items-center gap-3.5 mb-5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-600 to-gold flex items-center justify-center shadow-lg shadow-gold/10 flex-shrink-0">
                    <span className="text-midnight font-bold text-sm tracking-tight">
                        {initials}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-white/90 font-semibold text-sm truncate">
                        {user.full_name || 'User'}
                    </h3>
                    <p className="text-white/30 text-xs truncate font-mono">
                        {user.email}
                    </p>
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2 mb-5">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-3.5 text-center">
                    <div className="font-display text-xl font-bold text-aggie-400">0</div>
                    <div className="text-white/25 text-[0.65rem] mt-0.5 uppercase tracking-wider">Sessions</div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-3.5 text-center">
                    <div className="font-display text-xl font-bold text-sage">0</div>
                    <div className="text-white/25 text-[0.65rem] mt-0.5 uppercase tracking-wider">Favorites</div>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-1.5">
                {[
                    {
                        label: 'Profile',
                        icon: (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        ),
                    },
                    {
                        label: 'History',
                        icon: (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12,6 12,12 16,14" />
                            </svg>
                        ),
                    },
                    {
                        label: 'Favorites',
                        icon: (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                            </svg>
                        ),
                    },
                ].map(({ label, icon }) => (
                    <button
                        key={label}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all duration-200 text-sm group"
                    >
                        <span className="opacity-50 group-hover:opacity-80 transition-opacity">{icon}</span>
                        <span>{label}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity -translate-x-1 group-hover:translate-x-0 transition-transform">
                            <polyline points="9,18 15,12 9,6" />
                        </svg>
                    </button>
                ))}
            </div>

            {/* Logout */}
            <div className="mt-4 pt-4 border-t border-white/[0.04]">
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-rose/60 hover:text-rose hover:bg-rose/5 border border-transparent hover:border-rose/10 transition-all duration-200 text-sm"
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                        <polyline points="16,17 21,12 16,7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                </button>
            </div>
        </div>
    )
}
