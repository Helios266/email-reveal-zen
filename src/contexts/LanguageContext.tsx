
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Language translations
const translations = {
  // Authentication pages
  'Sign Up': 'サインアップ',
  'Log In': 'ログイン',
  'Email': 'メールアドレス',
  'Password': 'パスワード',
  'Confirm Password': 'パスワード (確認)',
  'Forgot Password?': 'パスワードをお忘れですか？',
  'Reset Password': 'パスワードをリセット',
  'Name': '名前',
  'Already have an account?': 'アカウントをお持ちですか？',
  'Don\'t have an account?': 'アカウントをお持ちでないですか？',
  'Sign up now': '今すぐサインアップ',
  'Log in now': '今すぐログイン',
  'Reset your password': 'パスワードをリセット',
  'Back to login': 'ログインに戻る',
  'Send reset link': 'リセットリンクを送信',
  'Check your email for the reset link': 'リセットリンクをメールで確認してください',
  'Log Out': 'ログアウト',
  'Sign up successful! Please check your email for verification.': 'サインアップ成功！確認用メールをご確認ください。',

  // Dashboard
  'Welcome': 'ようこそ',
  'Dashboard': 'ダッシュボード',
  'Single Email Lookup': '単一メールルックアップ',
  'Bulk Email Processing': '一括メール処理',
  'Search': '検索',
  'Export': 'エクスポート',
  'Export All': 'すべてエクスポート',
  'Upload CSV': 'CSVアップロード',
  'Results': '結果',
  'No results found': '結果が見つかりません',
  'Processing...': '処理中...',
  'Enter email address': 'メールアドレスを入力',
  'Search Results': '検索結果',
  
  // Email lookup results
  'Company': '会社',
  'Social Profile': 'ソーシャルプロフィール',
  'LinkedIn': 'LinkedIn',
  'Twitter': 'Twitter',
  'Drop CSV file here or click to upload': 'CSVファイルをここにドロップするか、クリックしてアップロード',
  'Uploaded': 'アップロード完了',
  'Processing': '処理中',
  'Error': 'エラー',
  'File must be a CSV': 'ファイルはCSV形式である必要があります',
  
  // Validation messages
  'Email is required': 'メールアドレスが必要です',
  'Invalid email format': '無効なメール形式です',
  'Password is required': 'パスワードが必要です',
  'Password must be at least 6 characters': 'パスワードは6文字以上である必要があります',
  'Passwords do not match': 'パスワードが一致しません',
  'Name is required': '名前が必要です',
  
  // Notification messages
  'Success': '成功',
  'Warning': '警告',
  'Info': '情報',
  'Account created successfully': 'アカウントが正常に作成されました',
  'Logged in successfully': 'ログインに成功しました',
  'Logged out successfully': 'ログアウトに成功しました',
  'Reset link sent to your email': 'リセットリンクがメールに送信されました',
  'Something went wrong': '問題が発生しました',
  
  // Generic
  'Cancel': 'キャンセル',
  'Save': '保存',
  'Delete': '削除',
  'Edit': '編集',
  'View': '表示',
  'Loading': '読み込み中...',
  'No data available': 'データがありません',
  'Back': '戻る',
  'Next': '次へ',
  'Submit': '送信',
  'Reset': 'リセット',
  'Verify': '確認',
  'Done': '完了'
};

interface LanguageContextType {
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language] = useState('ja'); // Default to Japanese

  // Translation function
  const t = (key: string): string => {
    if (language === 'ja' && key in translations) {
      return translations[key as keyof typeof translations];
    }
    return key; // Fallback to key itself if translation not found
  };

  return (
    <LanguageContext.Provider value={{ t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
