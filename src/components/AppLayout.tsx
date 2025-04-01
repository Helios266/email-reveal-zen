
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { LogOut, Globe, LogIn, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const AppLayout = () => {
  const { user, signOut } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 min-h-screen hidden md:flex md:flex-col justify-between animate-fade-in">
        <div>
          <div className="flex h-14 items-center border-b px-4">
            <div className="font-semibold text-lg text-primary">Email Lookup</div>
          </div>
          <div className="py-4">
            <nav className="space-y-1 px-2">
              <Link 
                to="/dashboard" 
                className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary animated-border"
              >
                <span>{t('Dashboard')}</span>
              </Link>
              <Link 
                to="/dashboard" 
                className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary animated-border"
              >
                <span>{t('Single Email Lookup')}</span>
              </Link>
              <Link 
                to="/dashboard" 
                className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary animated-border"
              >
                <span>{t('Bulk Email Processing')}</span>
              </Link>
            </nav>
          </div>
        </div>
        
        {/* Footer controls - moved to the bottom with padding */}
        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full justify-start mb-2"
            onClick={toggleLanguage}
          >
            <Globe className="mr-2 h-4 w-4" />
            {language === 'ja' ? t('Switch to English') : t('Switch to Japanese')}
          </Button>
          {user ? (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t('Log Out')}
            </Button>
          ) : (
            <Link to="/login" className="w-full">
              <Button
                variant="outline"
                className="w-full justify-start"
              >
                <LogIn className="mr-2 h-4 w-4" />
                {t('Log In')}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-white z-50 border-b md:hidden animate-slide-in-bottom">
          <nav className="py-2 px-4">
            <Link 
              to="/dashboard" 
              className="block px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>{t('Dashboard')}</span>
            </Link>
            <Link 
              to="/dashboard" 
              className="block px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>{t('Single Email Lookup')}</span>
            </Link>
            <Link 
              to="/dashboard" 
              className="block px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>{t('Bulk Email Processing')}</span>
            </Link>
          </nav>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-14 border-b flex items-center justify-between px-4 bg-white">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 mr-2 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="md:hidden font-semibold text-lg text-primary">Email Lookup</div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <span className="text-sm text-gray-600">{t('Welcome')}, {user.name}</span>
            ) : (
              <span className="text-sm text-gray-600">{t('Welcome')}, {t('Guest')}</span>
            )}
            
            {/* Mobile language and logout buttons */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleLanguage}
            >
              <Globe className="h-4 w-4" />
            </Button>
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                >
                  <LogIn className="h-4 w-4" />
                </Button>
              </Link>
            )}
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
