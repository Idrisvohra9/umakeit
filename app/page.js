import GooeyNav from "@/components/GooeyNav";
import TextPressure from "@/components/TextPressure";

const items = [
  { label: "Home", href: "#" },
  { label: "About", href: "#" },
  { label: "Contact", href: "#" },
];
export default function Home() {
  return (
    <div className="min-h-screen w-full bg-[#000000] relative text-white">
      {/* Gradient Diagonal Lines Pattern */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
         repeating-linear-gradient(45deg, rgba(0, 255, 65, 0.08) 0, rgba(0, 255, 65, 0.08) 1px, transparent 1px, transparent 12px),
        repeating-linear-gradient(-45deg, rgba(0, 255, 65, 0.08) 0, rgba(0, 255, 65, 0.08) 1px, transparent 1px, transparent 12px),
        repeating-linear-gradient(90deg, rgba(0, 255, 65, 0.03) 0, rgba(0, 255, 65, 0.03) 1px, transparent 1px, transparent 4px)
      `,
          backgroundSize: "24px 24px, 24px 24px, 8px 8px",
        }}
      />
      <GooeyNav
        items={items}
        particleCount={15}
        particleDistances={[90, 10]}
        particleR={100}
        initialActiveIndex={0}
        animationTime={600}
        timeVariance={300}
        colors={[1, 2, 3, 1, 2, 3, 1, 4]}
      />
      <div className="flex items-center justify-center h-screen pt-18">
        <div className="max-w-3xl w-full px-4">
          <TextPressure
            text="UMakeIt!"
            flex={true}
            alpha={false}
            stroke={false}
            width={true}
            weight={true}
            italic={true}
            textColor="#ffffff"
            strokeColor="#ff0000"
            minFontSize={24}
          />
        </div>
      </div>
    </div>
  );
}
