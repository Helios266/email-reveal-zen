
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signUp, loading } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = t('Name is required');
    if (!email.trim()) newErrors.email = t('Email is required');
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = t('Invalid email format');
    
    if (!password) newErrors.password = t('Password is required');
    else if (password.length < 6) newErrors.password = t('Password must be at least 6 characters');
    
    if (password !== confirmPassword) newErrors.confirmPassword = t('Passwords do not match');
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      await signUp(email, password, name);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="absolute top-4 right-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleLanguage}
          className="flex items-center gap-1"
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs">{language === 'ja' ? 'English' : '日本語'}</span>
        </Button>
      </div>
      <div className="w-full max-w-md animate-fade-in">
        <Card className="border-none shadow-lg glass-panel">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">{t('Sign Up')}</CardTitle>
            <CardDescription className="text-center">
              {t('Create your account to get started')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('Name')}</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('Name')}
                  disabled={loading}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">{t('Email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('Email')}
                  disabled={loading}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t('Password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('Password')}
                  disabled={loading}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('Confirm Password')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('Confirm Password')}
                  disabled={loading}
                  className={errors.confirmPassword ? 'border-destructive' : ''}
                />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {t('Loading')}
                  </div>
                ) : (
                  t('Sign Up')
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <p className="text-center text-sm text-muted-foreground">
              {t('Already have an account?')}{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                {t('Log in now')}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
