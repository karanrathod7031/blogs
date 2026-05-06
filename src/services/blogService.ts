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
  and,
  increment,
  setDoc,
  limit,
  startAfter,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { BlogPost, Comment } from '../types';
import { requestOrchestrator } from '../core/scaling/RequestOrchestrator';

const COLLECTION_NAME = 'posts';

// Interaction Services

export async function toggleLike(postId: string, userId: string, currentlyLiked: boolean): Promise<void> {
  const { writeBatch } = await import('firebase/firestore');
  const batch = writeBatch(db);
  const postRef = doc(db, COLLECTION_NAME, postId);
  const likeRef = doc(db, COLLECTION_NAME, postId, 'likes', userId);

  try {
    if (currentlyLiked) {
      batch.delete(likeRef);
      batch.update(postRef, { likeCount: increment(-1) });
    } else {
      batch.set(likeRef, { userId, timestamp: serverTimestamp() });
      batch.update(postRef, { likeCount: increment(1) });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `posts/${postId}/likes`);
  }
}

export async function isPostLiked(postId: string, userId: string): Promise<boolean> {
  try {
    const likeSnap = await getDoc(doc(db, COLLECTION_NAME, postId, 'likes', userId));
    return likeSnap.exists();
  } catch (err) {
    return false;
  }
}

export async function addComment(postId: string, authorId: string, authorName: string, content: string, authorPhoto?: string): Promise<Comment> {
  const commentData = {
    postId,
    authorId,
    authorName,
    authorPhoto: authorPhoto || null,
    content,
    createdAt: serverTimestamp()
  };

  try {
    const docRef = await addDoc(collection(db, 'comments'), commentData);
    return {
      id: docRef.id,
      ...commentData,
      createdAt: Timestamp.now() // For immediate UI feedback
    } as any;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'comments');
    throw error;
  }
}

export async function getComments(postId: string): Promise<Comment[]> {
  const requestId = `comments_${postId}`;
  
  return requestOrchestrator.collapse(requestId, async () => {
    const q = query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      orderBy('createdAt', 'desc')
    );

    try {
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'comments');
      return [];
    }
  });
}

export async function getPublishedPosts(lastDoc?: QueryDocumentSnapshot): Promise<{ posts: BlogPost[], lastVisible: QueryDocumentSnapshot | null }> {
  // Collapse identical requests to scale successfully under 1000+ simultaneous bursts
  const requestId = lastDoc ? `list_${lastDoc.id}` : 'list_root';
  
  return requestOrchestrator.collapse(requestId, async () => {
    const postsRef = collection(db, COLLECTION_NAME);
    
    let q = query(
      postsRef, 
      where('published', '==', true),
      orderBy('createdAt', 'desc'),
      limit(9)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    try {
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      } as BlogPost));
      
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      
      return { posts, lastVisible };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      return { posts: [], lastVisible: null };
    }
  });
}

export async function getPublishedPostsForUser(userId: string): Promise<BlogPost[]> {
  const requestId = `user_posts_${userId}`;

  return requestOrchestrator.collapse(requestId, async () => {
    const postsRef = collection(db, COLLECTION_NAME);
    const q = query(
      postsRef, 
      where('authorId', '==', userId),
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
  });
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
  const requestId = `post_${slug}`;

  return requestOrchestrator.collapse(requestId, async () => {
    const postsRef = collection(db, COLLECTION_NAME);
    const user = auth.currentUser;
    
    // Fix: When using composite filters like or(), all top-level filters must be inside an and()
    const q = query(
      postsRef, 
      and(
        where('slug', '==', slug),
        user 
          ? or(
              where('published', '==', true),
              where('authorId', '==', user.uid)
            )
          : where('published', '==', true)
      )
    );

    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      const docSnap = querySnapshot.docs[0];
      const postData = docSnap.data() as any;
      
      // Increment view count asynchronously
      if (postData.published) {
        const postRef = doc(db, COLLECTION_NAME, docSnap.id);
        updateDoc(postRef, {
          viewCount: increment(1),
          updatedAt: serverTimestamp()
        }).catch(e => console.warn('Failed to increment view count', e));
      }

      return {
        id: docSnap.id,
        ...postData
      } as BlogPost;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      return null;
    }
  });
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
    console.log('Attempting to create post:', post.title);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), post);
    console.log('Post created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Create Post Error details:', error);
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
