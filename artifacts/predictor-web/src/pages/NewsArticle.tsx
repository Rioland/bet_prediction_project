import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

export default function NewsArticle() {
  const [, params] = useRoute("/news/:slug");
  const slug = params?.slug ?? "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["article", slug],
    queryFn: () => api.article(slug),
    enabled: Boolean(slug),
  });

  return (
    <Layout>
      <Link
        href="/news"
        className="mb-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        All analysis
      </Link>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error || !data ? (
        <p className="font-mono text-sm text-muted-foreground">Article not found.</p>
      ) : (
        <article className="prose prose-invert max-w-3xl">
          <h1 className="mb-2">{data.title}</h1>
          <p className="mt-0 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {data.author ? `${data.author} · ` : ""}
            {data.published_at ? format(new Date(data.published_at), "d MMMM yyyy") : ""}
          </p>
          <div className="whitespace-pre-wrap">{data.body}</div>
        </article>
      )}
    </Layout>
  );
}
