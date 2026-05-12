import { Timestamp } from 'firebase/firestore';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  published: boolean;
  tags: string[];
  coverImage?: string;
  category?: string;
  viewCount?: number;
  type: 'blog' | 'trade';
  tradeCategory?: string;
  tradeValue?: string;
  location?: string;
  likeCount?: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: Timestamp;
}

export interface Like {
  userId: string;
  timestamp: Timestamp;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  role: 'user' | 'admin';
  createdAt?: Timestamp;
  suspended?: boolean;
}

export interface AppStats {
  totalPosts: number;
  totalViews: number;
  totalUsers: number;
  totalLikes: number;
  totalComments: number;
}

export interface PostView {
  id: string;
  postId: string;
  timestamp: Timestamp;
  visitorId?: string;
}

export type View = 'list' | 'post' | 'admin' | 'editor' | 'admin-panel' | 'profile';
