import PostEditor from '@/app/components/blog/PostEditor';

interface EditBlogPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const { slug } = await params;

  const query = `query GetPost($idOrSlug: String!) { getPost(idOrSlug: $idOrSlug) { id title slug excerpt content coverImageUrl status createdAt updatedAt publishedAt creator { id name email } blogCategory { id name slug } tags { tag { id name slug } } relatedPosts { id title slug } } }`;
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { idOrSlug: slug } }),
    // do not cache editor fetch to keep latest
    cache: 'no-store',
  });
  const json = await resp.json();
  const post = json?.data?.getPost ?? null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Editar artículo</h1>
      <PostEditor initialData={post} />
    </div>
  );
}
