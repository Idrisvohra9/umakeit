import CurvedLoop from "@/components/CurvedLoop";
import GooeyNav from "@/components/GooeyNav";
import ProfileContainer from "@/components/ProfileContainer";
import TextPressure from "@/components/TextPressure";

const items = [
  { label: "Home", href: "#" },
  { label: "About", href: "#" },
  { label: "Contact", href: "#" },
];
export default function Home() {
  return (
    <div className="min-h-screen w-full bg-black relative">
      {/* Dark Noise Colored Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "#000000",
          backgroundImage: `
        radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.2) 1px, transparent 0),
        radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.18) 1px, transparent 0),
        radial-gradient(circle at 1px 1px, rgba(236, 72, 153, 0.15) 1px, transparent 0)
      `,
          backgroundSize: "20px 20px, 30px 30px, 25px 25px",
          backgroundPosition: "0 0, 10px 10px, 15px 5px",
        }}
      />
      {/* Your Content/Components */}
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
      <ProfileContainer />
      <CurvedLoop
        marqueeText="Go ✦ Bonkers ✦ With ✦ UMakeIt! ✦"
        speed={3}
        curveAmount={500}
        direction="right"
        interactive={true}
        className="custom-text-style"
      />
    </div>
  );
}
