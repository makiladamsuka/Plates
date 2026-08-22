import { supabase } from '../lib/supabase';
import { LogOut } from 'lucide-react';

interface ProfileProps {
  session: any;
}

export function Profile({ session }: ProfileProps) {
  const user = session?.user;
  const fullName = user?.user_metadata?.full_name || user?.email || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url;

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-32 pt-10 px-6">
      <h1 className="text-black text-5xl font-bold font-['Sora'] mb-12">Profile</h1>
      
      <div className="bg-white rounded-[35px] p-8 shadow-sm flex flex-col items-center">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" className="w-24 h-24 rounded-full mb-4 object-cover" />
        ) : (
          <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 flex items-center justify-center">
            <span className="text-gray-500 text-3xl font-['Sora']">{fullName.charAt(0)}</span>
          </div>
        )}
        
        <h2 className="text-zinc-900 text-2xl font-semibold font-['Sora'] mb-1 text-center">{fullName}</h2>
        <p className="text-gray-500 text-sm font-['Sora'] mb-10">{user?.email}</p>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 bg-red-50 text-red-600 hover:bg-red-100 transition-colors py-4 rounded-[30px]"
        >
          <LogOut size={20} />
          <span className="text-lg font-semibold font-['Sora']">Log Out</span>
        </button>
      </div>
    </div>
  );
}
