import { Nav } from '@/components/nav';

export default function MastersLoading() {
  return (
    <>
      <Nav showSearch={false} />
      <main className="shell py-10 sm:py-12">
        <section className="mb-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <div className="h-3 w-36 rounded-full bg-surface-3" />
            <div className="mt-5 h-14 max-w-2xl rounded-md bg-surface-3" />
            <div className="mt-3 h-14 max-w-xl rounded-md bg-surface-2" />
          </div>
          <div className="hidden lg:block justify-self-end">
            <div className="h-4 w-32 rounded-full bg-surface-3" />
            <div className="mt-3 h-4 w-24 rounded-full bg-surface-2" />
          </div>
        </section>

        <section className="mb-8 border-y border-border py-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_120px]">
            <div className="h-11 rounded-md bg-surface-2" />
            <div className="h-11 rounded-md bg-surface-2" />
            <div className="h-11 rounded-md bg-surface-2" />
          </div>
        </section>

        <section className="mb-8 flex gap-2">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-9 w-24 rounded-full bg-surface-2"
            />
          ))}
        </section>

        <section className="divide-y divide-border border-t border-border">
          {[1, 2, 3].map((item) => (
            <div key={item} className="grid gap-5 py-7 sm:grid-cols-[1fr_220px]">
              <div>
                <div className="h-3 w-28 rounded-full bg-surface-3" />
                <div className="mt-4 h-7 max-w-sm rounded-md bg-surface-2" />
                <div className="mt-4 h-4 max-w-xl rounded-md bg-surface-2" />
              </div>
              <div className="sm:justify-self-end">
                <div className="h-4 w-28 rounded-full bg-surface-2" />
              </div>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
