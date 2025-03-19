
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type LanguageContextType = {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
};

// Create the context with a default value
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

// Custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext);

// Define available translations
const translations: Record<string, Record<string, string>> = {
  en: {
    'Dashboard': 'Dashboard',
    'Welcome': 'Welcome',
    'Single Email Lookup': 'Single Email Lookup',
    'Bulk Email Processing': 'Bulk Email Processing',
    'Enter an email address to find contact details': 'Enter an email address to find contact details',
    'Enter email address': 'Enter email address',
    'Processing...': 'Processing...',
    'Search': 'Search',
    'Search Results': 'Search Results',
    'Export': 'Export',
    'Name': 'Name',
    'Company': 'Company',
    'Social Profile': 'Social Profile',
    'LinkedIn': 'LinkedIn',
    'Twitter': 'Twitter',
    'No results found': 'No results found',
    'Upload a CSV file with email addresses to process in bulk': 'Upload a CSV file with email addresses to process in bulk',
    'Drop CSV file here or click to upload': 'Drop CSV file here or click to upload',
    'CSV file should have an "email" column': 'CSV file should have an "email" column',
    'Uploaded': 'Uploaded',
    'Processing': 'Processing',
    'Error': 'Error',
    'Results': 'Results',
    'Found': 'Found',
    'Export All': 'Export All',
    'Email': 'Email',
    'Invalid email format': 'Invalid email format',
    'Something went wrong': 'Something went wrong',
    'Exported successfully': 'Exported successfully',
    'No valid emails found in the CSV': 'No valid emails found in the CSV',
    'File must be a CSV': 'File must be a CSV',
  },
  ja: {
    'Dashboard': 'ダッシュボード',
    'Welcome': 'ようこそ',
    'Single Email Lookup': '単一メールの検索',
    'Bulk Email Processing': '一括メール処理',
    'Enter an email address to find contact details': '連絡先の詳細を検索するメールアドレスを入力してください',
    'Enter email address': 'メールアドレスを入力',
    'Processing...': '処理中...',
    'Search': '検索',
    'Search Results': '検索結果',
    'Export': 'エクスポート',
    'Name': '名前',
    'Company': '会社',
    'Social Profile': 'ソーシャルプロフィール',
    'LinkedIn': 'LinkedIn',
    'Twitter': 'Twitter',
    'Uploaded': 'アップロード完了',
    'Processing': '処理中',
    'Error': 'エラー',
    'No results found': '結果が見つかりません',
    'Upload a CSV file with email addresses to process in bulk': '一括処理するメールアドレスを含むCSVファイルをアップロード',
    'Drop CSV file here or click to upload': 'CSVファイルをここにドロップするか、クリックしてアップロード',
    'CSV file should have an "email" column': 'CSVファイルには「email」列が必要です',
    'Results': '結果',
    'Found': '見つかった',
    'Export All': 'すべてエクスポート',
    'Email': 'メール',
    'Invalid email format': '無効なメール形式',
    'Something went wrong': 'エラーが発生しました',
    'Exported successfully': 'エクスポート成功',
    'No valid emails found in the CSV': 'CSVに有効なメールが見つかりません',
    'File must be a CSV': 'ファイルはCSV形式である必要があります',
  },
};

// Provider component that wraps the app
export const LanguageProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState('en');
  
  // Load saved language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);
  
  // Save language preference to localStorage
  const changeLanguage = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };
  
  // Translation function
  const t = (key: string): string => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    
    // Fallback to English if translation not found
    if (translations['en'] && translations['en'][key]) {
      return translations['en'][key];
    }
    
    // Return the key if translation not available
    return key;
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
