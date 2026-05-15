import sparkleSrc from "@/assets/ai-sparkle.png";

export function AiSparkle({ className }: { className?: string }) {
  return (
    <img
      src={sparkleSrc}
      alt=""
      aria-hidden="true"
      loading="lazy"
      width={512}
      height={512}
      className={className}
      draggable={false}
    />
  );
}
