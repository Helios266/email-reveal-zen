
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { LogOut } from 'lucide-react';

const AppLayout = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();

  if (!user) return <Outlet />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 min-h-screen hidden md:block animate-fade-in">
        <div className="flex h-14 items-center border-b px-4">
          <div className="font-semibold text-lg text-primary">Reverse Email Lookup</div>
        </div>
        <div className="py-4">
          <nav className="space-y-1 px-2">
            <a 
              href="/dashboard" 
              className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary animated-border"
            >
              <span>{t('Dashboard')}</span>
            </a>
            <a 
              href="/dashboard" 
              className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary animated-border"
            >
              <span>{t('Single Email Lookup')}</span>
            </a>
            <a 
              href="/dashboard" 
              className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary animated-border"
            >
              <span>{t('Bulk Email Processing')}</span>
            </a>
          </nav>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t('Log Out')}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-14 border-b flex items-center justify-between px-4 bg-white">
          <div className="md:hidden font-semibold text-lg text-primary">Reverse Email Lookup</div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{t('Welcome')}, {user.name}</span>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto bg-gray-50">
          <div className="animate-slide-in-bottom">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
