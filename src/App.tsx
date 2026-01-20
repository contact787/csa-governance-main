import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Menu } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Standards from "./pages/Standards";
import StandardDetail from "./pages/StandardDetail";
import ComplianceReview from "./pages/ComplianceReview";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import Profile from "./pages/Profile";
import Management from "./pages/Management";
import RomaReports from "./pages/RomaReports";
import Announcements from "./pages/Announcements";
import Resources from "./pages/Resources";
import Inbox from "./pages/Inbox";
import Organizations from "./pages/Organizations";
import UsagePanel from "./pages/UsagePanel";
import AcceptInvite from "./pages/AcceptInvite";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="flex min-h-screen w-full flex-col">
                    {/* Mobile header with hamburger menu */}
                    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
                      <div className="flex h-14 items-center px-4">
                        <SidebarTrigger className="mr-2">
                          <Menu className="h-5 w-5" />
                          <span className="sr-only">Toggle Menu</span>
                        </SidebarTrigger>
                        <h1 className="text-lg font-semibold">CSA Governance</h1>
                      </div>
                    </header>

                    <div className="flex flex-1 w-full">
                      <AppSidebar />
                      <main className="flex-1 overflow-auto">
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/standards" element={<Standards />} />
                          <Route path="/standard-detail" element={<StandardDetail />} />
                          <Route path="/compliance-review" element={<ComplianceReview />} />
                          <Route path="/roma-reports" element={<RomaReports />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/management" element={<Management />} />
                          <Route path="/announcements" element={<Announcements />} />
                          <Route path="/resources" element={<Resources />} />
                          <Route path="/inbox" element={<Inbox />} />
                          <Route path="/organizations" element={<Organizations />} />
                          <Route path="/usage-panel" element={<UsagePanel />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </main>
                    </div>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
