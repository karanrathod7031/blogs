import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  Timestamp,
  or,
  and
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { BlogPost } from '../types';

const COLLECTION_NAME = 'posts';

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const postsRef = collection(db, COLLECTION_NAME);
  const q = query(
    postsRef, 
    where('published', '==', true),
    orderBy('createdAt', 'desc')
  );

  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    } as BlogPost));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
}

export async function getAllPostsForUser(userId: string): Promise<BlogPost[]> {
  const postsRef = collection(db, COLLECTION_NAME);
  const q = query(
    postsRef, 
    where('authorId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    } as BlogPost));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const postsRef = collection(db, COLLECTION_NAME);
  const user = auth.currentUser;
  
  let q;
  if (user) {
    q = query(
      postsRef,
      and(
        where('slug', '==', slug),
        or(where('published', '==', true), where('authorId', '==', user.uid))
      )
    );
  } else {
    q = query(
      postsRef,
      where('slug', '==', slug),
      where('published', '==', true)
    );
  }

  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...(doc.data() as any)
    } as BlogPost;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
    return null;
  }
}

export async function createPost(postData: Partial<BlogPost>): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be logged in to create a post');

  const post = {
    ...(postData as any),
    authorId: user.uid,
    authorName: user.displayName || 'Anonymous',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    published: postData.published || false,
    tags: postData.tags || [],
  };

  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), post);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    return '';
  }
}

export async function updatePost(postId: string, postData: Partial<BlogPost>): Promise<void> {
  const postRef = doc(db, COLLECTION_NAME, postId);
  
  try {
    await updateDoc(postRef, {
      ...postData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${postId}`);
  }
}

export async function deletePost(postId: string): Promise<void> {
  const postRef = doc(db, COLLECTION_NAME, postId);
  try {
    await deleteDoc(postRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${postId}`);
  }
}
