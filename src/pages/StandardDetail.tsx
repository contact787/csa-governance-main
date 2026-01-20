import { useSearchParams } from "react-router-dom";
import GenericStandardDetail from "@/components/standards/GenericStandardDetail";
import { STANDARD_CONFIGS } from "@/components/standards/configs";

export default function StandardDetail() {
  const [searchParams] = useSearchParams();
  const standardIdParam = searchParams.get("standardId");

  // Look up the config for this standard
  const config = standardIdParam ? STANDARD_CONFIGS[standardIdParam] : null;

  if (config) {
    return <GenericStandardDetail config={config} />;
  }

  // Fallback for unknown standards
  return (
    <div className="container mx-auto p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Standard Not Found</h1>
        <p className="text-muted-foreground">
          The requested standard "{standardIdParam}" could not be found.
        </p>
      </div>
    </div>
  );
}
