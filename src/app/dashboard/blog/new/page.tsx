'use client';
import PostForm from '@/app/components/blog/PostForm';
import { useSessionStore } from '@/lib/store/dashboard';

export default function NewBlogPage() {
  const { user } = useSessionStore();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Nuevo artículo del blog</h1>
      <PostForm
        storeId={user?.storeId}
        restaurantId={user?.restaurantId}
        serviceProviderId={user?.serviceProviderId}
      />
    </div>
  );
}
