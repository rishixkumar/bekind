export default function HelloLayout({ children }: LayoutProps<"/hello">) {
  return (
    <div className="min-h-dvh flex-1 bg-[#000d1a] text-[#f4f1e8] [&_h1]:text-[#B3A369] [&_h2]:text-[#B3A369] [&_h3]:text-[#B3A369]">
      {children}
    </div>
  );
}
