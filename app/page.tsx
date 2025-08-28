"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

export default function Home() {
  const [baseDomain, setBaseDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [serviceUrl, setServiceUrl] = useState<string | null>(null);
  const [partsUrl, setPartsUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setServiceUrl(null);
    setPartsUrl(null);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseDomain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      setServiceUrl(data.serviceUrl);
      setPartsUrl(data.partsUrl);
      toast.success("Links generated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="font-sans min-h-screen p-6 md:p-10 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Generate Toyota Insurance Links</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="baseDomain">Toyota Base Domain</Label>
              <Input
                id="baseDomain"
                placeholder="Put Toyota base domain here"
                value={baseDomain}
                onChange={(e) => setBaseDomain(e.target.value)}
                required
                pattern="[a-z0-9-]+"
                title="Use lowercase letters, numbers, and hyphens only"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Fetching..." : "Submit"}
            </Button>
          </form>

          {(serviceUrl || partsUrl) && (
            <div className="mt-6 space-y-3">
              {serviceUrl && (
                <div className="flex items-start gap-2">
                  <div className="break-all">
                    <span className="font-medium">Service URL: </span>
                    <a
                      className="underline"
                      href={serviceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {serviceUrl}
                    </a>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Copy service URL"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(serviceUrl);
                        toast.success("Copied");
                      } catch {
                        toast.error("Failed to copy");
                      }
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {partsUrl && (
                <div className="flex items-start gap-2">
                  <div className="break-all">
                    <span className="font-medium">Parts URL: </span>
                    <a
                      className="underline"
                      href={partsUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {partsUrl}
                    </a>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Copy parts URL"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(partsUrl);
                        toast.success("Copied");
                      } catch {
                        toast.error("Failed to copy");
                      }
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
