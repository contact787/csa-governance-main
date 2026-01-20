import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, FileText, AlertCircle, ChevronRight, ArrowLeft, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OrganizationStandard {
  id: string;
  status: string;
  due_date: string | null;
  standard: {
    id: string;
    standard_id: string;
    title: string;
    category: string;
  };
}

const statusColors = {
  compliant: "bg-green-500",
  pending: "bg-yellow-500",
  submitted: "bg-blue-500",
  not_compliant: "bg-red-500",
};

const statusIcons = {
  compliant: CheckCircle2,
  pending: Clock,
  submitted: FileText,
  not_compliant: AlertCircle,
};

const categoryNames: Record<string, { title: string; description: string }> = {
  "consumer-input": {
    title: "Consumer Input & Involvement",
    description: "Standards 1.1 – 1.3"
  },
  "community-engagement": {
    title: "Community Engagement",
    description: "Standards 2.1 – 2.4"
  },
  "community-assessment": {
    title: "Community Assessment",
    description: "Standards 3.1 – 3.5"
  },
  "organizational-leadership": {
    title: "Organizational Leadership",
    description: "Standards 4.1 – 4.6"
  },
  "board-governance": {
    title: "Board Governance",
    description: "Standards 5.1 – 5.9"
  },
  "strategic-planning": {
    title: "Strategic Planning",
    description: "Standards 6.1 – 6.5"
  },
  "human-resource-management": {
    title: "Human Resource Management",
    description: "Standards 7.1 – 7.9"
  },
  "financial-operations-oversight": {
    title: "Financial Operations & Oversight",
    description: "Standards 8.1 – 8.13"
  },
  "data-analysis": {
    title: "Data & Analysis",
    description: "Standards 9.1 – 9.4"
  }
};

interface CategoryStats {
  categoryId: string;
  total: number;
  compliant: number;
  pending: number;
  submitted: number;
  not_compliant: number;
}

export default function Standards() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [standards, setStandards] = useState<OrganizationStandard[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const categoryId = searchParams.get("category");
  const categoryInfo = categoryId ? categoryNames[categoryId] : null;

  useEffect(() => {
    if (categoryId) {
      loadStandards();
    } else {
      loadCategoryStats();
    }
  }, [categoryId]);

  // Helper function to sort standard IDs numerically (1.1, 1.2, 1.10, etc.)
  const sortByStandardId = (a: OrganizationStandard, b: OrganizationStandard) => {
    const parseId = (id: string) => {
      const parts = id.split('.').map(Number);
      return parts;
    };
    const aParts = parseId(a.standard.standard_id);
    const bParts = parseId(b.standard.standard_id);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aVal = aParts[i] || 0;
      const bVal = bParts[i] || 0;
      if (aVal !== bVal) return aVal - bVal;
    }
    return 0;
  };

  const loadStandards = async () => {
    try {
      const { data, error } = await supabase
        .from("organization_standards")
        .select(`
          id,
          status,
          due_date,
          standard:standards (
            id,
            standard_id,
            title,
            category
          )
        `);

      if (error) throw error;
      
      // Filter by category and sort numerically by standard_id
      const filteredData = (data as any[])
        .filter((item) => item.standard && item.standard.category === categoryId)
        .sort(sortByStandardId);
      
      setStandards(filteredData);
    } catch (error: any) {
      toast({
        title: "Error loading standards",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryStats = async () => {
    try {
      const { data, error } = await supabase
        .from("organization_standards")
        .select(`
          id,
          status,
          standard:standards (
            category
          )
        `);

      if (error) throw error;

      // Calculate stats for each category
      const stats: CategoryStats[] = Object.keys(categoryNames).map((catId) => {
        const categoryStandards = (data as any[]).filter(
          (item) => item.standard && item.standard.category === catId
        );
        
        return {
          categoryId: catId,
          total: categoryStandards.length,
          compliant: categoryStandards.filter(s => s.status === "compliant").length,
          pending: categoryStandards.filter(s => s.status === "pending").length,
          submitted: categoryStandards.filter(s => s.status === "submitted").length,
          not_compliant: categoryStandards.filter(s => s.status === "not_compliant").length,
        };
      });

      setCategoryStats(stats);
    } catch (error: any) {
      toast({
        title: "Error loading categories",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  // Show categories overview
  if (!categoryId) {
    return (
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Standards Categories</h1>
          <p className="text-muted-foreground">Select a category to view and manage standards</p>
        </div>

        <div className="grid gap-6">
          {categoryStats.map((stats) => {
            const categoryInfo = categoryNames[stats.categoryId];
            const compliantPercent = stats.total > 0 ? (stats.compliant / stats.total) * 100 : 0;
            const submittedPercent = stats.total > 0 ? (stats.submitted / stats.total) * 100 : 0;
            const pendingPercent = stats.total > 0 ? (stats.pending / stats.total) * 100 : 0;

            return (
              <Card
                key={stats.categoryId}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/standards?category=${stats.categoryId}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{categoryInfo.title}</CardTitle>
                      <CardDescription className="text-base">{categoryInfo.description}</CardDescription>
                    </div>
                    <ChevronRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-col md:flex-row md:justify-between gap-2 text-sm text-muted-foreground">
                      <span>{stats.total} Standards</span>
                      <span>
                        {stats.compliant} Compliant • {stats.submitted} Submitted • {stats.pending} Pending
                      </span>
                    </div>
                    <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="absolute h-full bg-green-500 transition-all"
                        style={{ width: `${compliantPercent}%` }}
                      />
                      <div
                        className="absolute h-full bg-blue-500 transition-all"
                        style={{
                          left: `${compliantPercent}%`,
                          width: `${submittedPercent}%`,
                        }}
                      />
                      <div
                        className="absolute h-full bg-yellow-500 transition-all"
                        style={{
                          left: `${compliantPercent + submittedPercent}%`,
                          width: `${pendingPercent}%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Show standards list for selected category
  if (!categoryInfo) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Category not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const compliantCount = standards.filter(s => s.status === "compliant").length;
  const totalCount = standards.length;

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <Button variant="outline" className="mb-4" onClick={() => navigate("/standards")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-3xl font-bold mb-2">{categoryInfo.title}</h1>
        <p className="text-muted-foreground">{categoryInfo.description}</p>
        <p className="text-sm font-medium mt-2">
          {compliantCount}/{totalCount} done
        </p>
      </div>

      {standards.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No standards found in this category
          </CardContent>
        </Card>
      ) : (
        <TooltipProvider>
          <div className="grid gap-4">
          {standards.map((orgStandard) => {
              const Icon = statusIcons[orgStandard.status as keyof typeof statusIcons] || Clock;
              const standardId = orgStandard.standard.standard_id;
              const detailUrl = `/standard-detail?id=${orgStandard.id}&standardId=${standardId}`;
              
              return (
                <Card
                  key={orgStandard.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(detailUrl)}
                >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-5 w-5" />
                        <CardTitle className="text-xl">{orgStandard.standard.title}</CardTitle>
                      </div>
                      <CardDescription>
                        <span className="font-medium">ID:</span> {orgStandard.standard.standard_id}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={statusColors[orgStandard.status as keyof typeof statusColors]}>
                        {orgStandard.status}
                      </Badge>
                      {!orgStandard.due_date && (
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Due date not set</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </CardHeader>
                </Card>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
