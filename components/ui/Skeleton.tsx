export function PropertyCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl overflow-hidden">
      <div className="aspect-[16/10] skeleton" />
      <div className="p-5 space-y-3">
        <div className="h-5 skeleton rounded-lg w-2/3" />
        <div className="h-4 skeleton rounded-lg w-3/4" />
        <div className="h-3 skeleton rounded-lg w-1/2" />
        <div className="h-10 skeleton rounded-xl mt-4" />
      </div>
    </div>
  );
}

export function AgentCardSkeleton() {
  return (
    <div className="p-5 bg-surface-container-lowest rounded-2xl">
      <div className="w-full aspect-square skeleton rounded-xl mb-4" />
      <div className="h-4 skeleton rounded-lg w-3/4 mb-2" />
      <div className="h-3 skeleton rounded-lg w-1/2 mb-1" />
      <div className="h-3 skeleton rounded-lg w-2/3 mb-4" />
      <div className="h-10 skeleton rounded-lg" />
    </div>
  );
}

export function TextSkeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}
