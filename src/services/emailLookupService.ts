
interface EmailLookupResult {
  name: string;
  company: string;
  linkedin?: string;
  twitter?: string;
  found: boolean;
}

// Mock dataset for demo purposes
const mockData: Record<string, EmailLookupResult> = {
  'john@example.com': {
    name: '山田 太郎',
    company: '株式会社ABC',
    linkedin: 'linkedin.com/in/johndoe',
    twitter: 'twitter.com/johndoe',
    found: true
  },
  'sarah@example.com': {
    name: '佐藤 優子',
    company: 'ソフトウェア株式会社',
    linkedin: 'linkedin.com/in/sarahjones',
    found: true
  },
  'alex@example.com': {
    name: '田中 翔太',
    company: 'デザインスタジオXYZ',
    twitter: 'twitter.com/alextaylor',
    found: true
  },
  'emma@example.com': {
    name: '鈴木 花子',
    company: 'テクノロジー株式会社',
    linkedin: 'linkedin.com/in/emmawhite',
    twitter: 'twitter.com/emmawhite',
    found: true
  }
};

// Function to simulate email lookup
export const lookupEmail = async (email: string): Promise<EmailLookupResult> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  if (email in mockData) {
    return mockData[email];
  }
  
  // 30% chance of finding a random person
  if (Math.random() < 0.3) {
    const names = ['伊藤 健太', '高橋 美咲', '渡辺 大輔', '斎藤 千華', '小林 誠'];
    const companies = ['テック株式会社', 'デザインラボ', '株式会社イノベーション', 'クリエイティブスタジオ', 'グローバル商事'];
    
    return {
      name: names[Math.floor(Math.random() * names.length)],
      company: companies[Math.floor(Math.random() * companies.length)],
      linkedin: Math.random() > 0.5 ? `linkedin.com/in/${email.split('@')[0]}` : undefined,
      twitter: Math.random() > 0.5 ? `twitter.com/${email.split('@')[0]}` : undefined,
      found: true
    };
  }
  
  // Not found
  return {
    name: '',
    company: '',
    found: false
  };
};

// Function to process a batch of emails
export const lookupEmailBatch = async (emails: string[]): Promise<Record<string, EmailLookupResult>> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const results: Record<string, EmailLookupResult> = {};
  
  for (const email of emails) {
    if (email in mockData) {
      results[email] = mockData[email];
    } else if (Math.random() < 0.3) {
      const names = ['伊藤 健太', '高橋 美咲', '渡辺 大輔', '斎藤 千華', '小林 誠'];
      const companies = ['テック株式会社', 'デザインラボ', '株式会社イノベーション', 'クリエイティブスタジオ', 'グローバル商事'];
      
      results[email] = {
        name: names[Math.floor(Math.random() * names.length)],
        company: companies[Math.floor(Math.random() * companies.length)],
        linkedin: Math.random() > 0.5 ? `linkedin.com/in/${email.split('@')[0]}` : undefined,
        twitter: Math.random() > 0.5 ? `twitter.com/${email.split('@')[0]}` : undefined,
        found: true
      };
    } else {
      results[email] = {
        name: '',
        company: '',
        found: false
      };
    }
  }
  
  return results;
};
