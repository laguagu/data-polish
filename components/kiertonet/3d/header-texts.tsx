import BlurIn from "@/components/magicui/blur-in";
import HyperText from "@/components/magicui/hyper-text";

type Props = {
  text: string;
};

export function HeaderTexts({ text }: Props) {
  return (
    <div className="flex items-center justify-center flex-col">
      <HyperText className="text-5xl font-bold text-white mb-4" text={text} />
      <BlurIn
        word="Enhance your CSV and Excel product data with AI-powered refinement"
        className="text-xl text-blue-200"
      />
    </div>
  );
}
