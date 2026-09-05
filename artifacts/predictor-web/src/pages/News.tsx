import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

export default function News() {
  const { data, isLoading } = useQuery({ queryKey: ["news"], queryFn: () => api.news(20) });

  return (
    <Layout>
      <h1 className="mb-6 text-3xl font-bold uppercase tracking-tight">Analysis</h1>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : !data?.length ? (
        <Card className="border-dashed border-border/50 bg-card/20 p-10 text-center">
          <h3 className="mb-1 font-bold">No articles yet</h3>
          <p className="font-mono text-xs text-muted-foreground">
            Published articles appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((article) => (
            <Link key={article.slug} href={`/news/${article.slug}`} className="block">
              <Card className="border-border/40 bg-card/50 p-5 transition-colors hover:border-primary/40">
                {article.published_at && (
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {format(new Date(article.published_at), "d MMM yyyy")}
                  </p>
                )}
                <h2 className="mb-1 text-lg font-bold leading-snug">{article.title}</h2>
                {article.excerpt && (
                  <p className="text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
